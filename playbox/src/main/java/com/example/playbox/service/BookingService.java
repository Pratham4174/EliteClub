package com.example.playbox.service;


import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.playbox.dto.AdminSlotStatusDTO;
import com.example.playbox.dto.AdminSportDayOverviewDTO;
import com.example.playbox.model.Booking;
import com.example.playbox.model.PlayBoxUser;
import com.example.playbox.model.Slot;
import com.example.playbox.model.Sport;
import com.example.playbox.model.TransactionEntity;
import com.example.playbox.repository.BookingRepository;
import com.example.playbox.repository.PlayBoxUserRepository;
import com.example.playbox.repository.SlotRepository;
import com.example.playbox.repository.SportRepository;
import com.example.playbox.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SlotRepository slotRepository;
    private final SportRepository sportRepository;
    private final PlayBoxUserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final TwilioSmsService twilioSmsService;
    private final BookingNotificationService bookingNotificationService;

    @Transactional
    public Booking bookSlot(Integer userId, Long slotId, String paymentMode) {
    
        // 1️⃣ Lock slot row
        Slot slot = slotRepository.findWithLockingById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        // 2️⃣ Get sport directly from slot
        Sport sport = slot.getSport();
        boolean multiSlotSport = isMultiSlotSport(sport);

        if (!multiSlotSport && Boolean.TRUE.equals(slot.getBooked())) {
            throw new RuntimeException("Slot already booked");
        }
    
        Float amount = sport.getPricePerHour();
        if (amount == null || amount <= 0f) {
            throw new RuntimeException("Sport pricing is not configured");
        }
    
        // 3️⃣ Fetch user
        PlayBoxUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCardUid() == null || user.getCardUid().isBlank()) {
            throw new RuntimeException("Get your Elite Card Now to reserve slots");
        }

        if (!"WALLET".equalsIgnoreCase(paymentMode)) {
            throw new RuntimeException("Only Elite Card wallet booking is allowed");
        }

        // 4️⃣ Wallet payment
        float currentBalance = user.getBalance() == null ? 0f : user.getBalance();
        if (currentBalance < amount) {
            throw new RuntimeException("Insufficient balance");
        }

        user.setBalance(currentBalance - amount);
        userRepository.save(user);

        TransactionEntity txn = new TransactionEntity();
        txn.setUserId(userId);
        txn.setUserName(user.getName());
        txn.setType("BOOKING");
        txn.setAmount(amount);
        txn.setBalanceAfter(user.getBalance());
        txn.setAdminName("SYSTEM");
        txn.setDescription(sport.getName() + " Booking");
        txn.setTimestamp(Instant.now());

        transactionRepository.save(txn);
    
        // 5️⃣ Mark slot booked
        if (!multiSlotSport) {
            slot.setBooked(true);
            slotRepository.save(slot);
        }
    
        // 6️⃣ Save booking
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setSportId(sport.getId());
        booking.setSlotId(slotId);
        booking.setAmount(amount);
        booking.setStatus("CONFIRMED");
        booking.setPaymentMode(paymentMode);
        booking.setCreatedAt(Instant.now().toString());

        Booking savedBooking = bookingRepository.save(booking);
        sendSmsSafely(() -> twilioSmsService.sendBookingWithDeductionSummary(
                user.getPhone(),
                sport.getName(),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                amount,
                user.getBalance()
        ));
        bookingNotificationService.notifyBookingCreated(savedBooking, user, sport, slot);

        return savedBooking;
    }

    @Transactional
    public Booking adminManualBookSlot(String name, String phone, String email, String remarks, Long slotId) {
        if (name == null || name.isBlank()) {
            throw new RuntimeException("Name is required");
        }
        if (phone == null || phone.isBlank()) {
            throw new RuntimeException("Phone is required");
        }
        if (slotId == null) {
            throw new RuntimeException("Slot is required");
        }

        Slot slot = slotRepository.findWithLockingById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        Sport sport = slot.getSport();
        boolean multiSlotSport = isMultiSlotSport(sport);

        if (!multiSlotSport && Boolean.TRUE.equals(slot.getBooked())) {
            throw new RuntimeException("Slot already booked");
        }

        Float amount = sport.getPricePerHour();
        if (amount == null || amount <= 0f) {
            amount = 0f;
        }

        PlayBoxUser user = userRepository.findByPhone(phone.trim());
        if (user != null) {
            user.setName(name.trim());
            if (email != null && !email.isBlank()) {
                user.setEmail(email.trim());
            }
        } else {
            user = new PlayBoxUser();
            user.setName(name.trim());
            user.setPhone(phone.trim());
            user.setEmail(email == null || email.isBlank() ? null : email.trim());
            user.setBalance(0f);
            user.setCardUid(null);
        }
        user = userRepository.save(user);

        if (!multiSlotSport) {
            slot.setBooked(true);
            slotRepository.save(slot);
        }

        Booking booking = new Booking();
        booking.setUserId(user.getId());
        booking.setSportId(sport.getId());
        booking.setSlotId(slot.getId());
        booking.setAmount(amount);
        booking.setStatus("CONFIRMED");
        booking.setPaymentMode("OFFLINE");
        booking.setRemarks(remarks == null || remarks.isBlank() ? null : remarks.trim());
        booking.setCreatedAt(Instant.now().toString());

        Booking savedBooking = bookingRepository.save(booking);
        PlayBoxUser finalUser = user;
        String otp = String.valueOf(ThreadLocalRandom.current().nextInt(1000, 10000));
        sendSmsSafely(() -> twilioSmsService.sendOfflineBookingOtp(
                finalUser.getPhone(),
                otp,
                sport.getName(),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime()
        ));
        bookingNotificationService.notifyBookingCreated(savedBooking, finalUser, sport, slot);

        return savedBooking;
    }

    @Transactional(readOnly = true)
    public AdminSportDayOverviewDTO getSportDayOverview(Long sportId, String date) {
        Sport sport = sportRepository.findById(sportId)
                .orElseThrow(() -> new RuntimeException("Sport not found"));

        List<Slot> slots = slotRepository.findBySport_IdAndSlotDate(sportId, date);
        List<Long> slotIds = slots.stream().map(Slot::getId).toList();

        Map<Long, Booking> bookingBySlotId = new HashMap<>();
        if (!slotIds.isEmpty()) {
            List<Booking> bookings = bookingRepository.findBySlotIdInAndStatus(slotIds, "CONFIRMED");
            for (Booking booking : bookings) {
                bookingBySlotId.putIfAbsent(booking.getSlotId(), booking);
            }
        }

        List<Integer> bookedUserIds = bookingBySlotId.values().stream()
                .map(Booking::getUserId)
                .toList();
        Map<Integer, PlayBoxUser> usersById = new HashMap<>();
        if (!bookedUserIds.isEmpty()) {
            userRepository.findAllById(bookedUserIds).forEach(user -> usersById.put(user.getId(), user));
        }

        List<AdminSlotStatusDTO> slotStatuses = new ArrayList<>();
        int bookedCount = 0;
        for (Slot slot : slots) {
            Booking booking = bookingBySlotId.get(slot.getId());
            boolean isBooked = booking != null || Boolean.TRUE.equals(slot.getBooked());
            if (isBooked) {
                bookedCount++;
            }

            AdminSlotStatusDTO dto = new AdminSlotStatusDTO();
            dto.setSlotId(slot.getId());
            dto.setSlotDate(slot.getSlotDate());
            dto.setStartTime(slot.getStartTime());
            dto.setEndTime(slot.getEndTime());
            dto.setBooked(isBooked);

            if (booking != null) {
                dto.setBookingId(booking.getId());
                dto.setUserId(booking.getUserId());
                dto.setAmount(booking.getAmount());
                dto.setStatus(booking.getStatus());
                dto.setPaymentMode(booking.getPaymentMode());
                dto.setCreatedAt(booking.getCreatedAt());

                PlayBoxUser user = usersById.get(booking.getUserId());
                dto.setUserName(user != null ? user.getName() : null);
            }

            slotStatuses.add(dto);
        }

        AdminSportDayOverviewDTO overview = new AdminSportDayOverviewDTO();
        overview.setSportId(sport.getId());
        overview.setSportName(sport.getName());
        overview.setCourtName(sport.getCourtName());
        overview.setDate(date);
        overview.setTotalSlots(slots.size());
        overview.setBookedSlots(bookedCount);
        overview.setEmptySlots(Math.max(slots.size() - bookedCount, 0));
        overview.setSlots(slotStatuses);

        return overview;
    }

    private void sendSmsSafely(Runnable smsOperation) {
        try {
            smsOperation.run();
        } catch (Exception ignored) {
            // Avoid failing booking transaction if SMS provider fails.
        }
    }

    private boolean isMultiSlotSport(Sport sport) {
        if (sport == null) {
            return false;
        }
        if (Boolean.TRUE.equals(sport.getIsmuplislot())) {
            return true;
        }

        String sportName = sport.getName() == null ? "" : sport.getName().trim().toLowerCase(Locale.ROOT);
        boolean isSwimming = sportName.contains("swimming");
        if (isSwimming) {
            sport.setIsmuplislot(true);
            sportRepository.save(sport);
            return true;
        }
        return false;
    }


}
