package com.example.playbox.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.playbox.dto.RechargeHistoryDTO;
import com.example.playbox.dto.TransactionDTO;
import com.example.playbox.dto.UserDetailsDTO;
import com.example.playbox.dto.UserStatsDTO;
import com.example.playbox.dto.UserSummaryDTO;
import com.example.playbox.model.AdminUser;
import com.example.playbox.model.Booking;
import com.example.playbox.model.PlayBoxUser;
import com.example.playbox.model.Slot;
import com.example.playbox.model.Sport;
import com.example.playbox.model.TransactionEntity;
import com.example.playbox.repository.AdminUserRepository;
import com.example.playbox.repository.BookingRepository;
import com.example.playbox.repository.PlayBoxUserRepository;
import com.example.playbox.repository.SlotRepository;
import com.example.playbox.repository.SportRepository;
import com.example.playbox.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl {

    private final PlayBoxUserRepository userRepo;
    private final TransactionRepository txRepo;
    private final SlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final AdminUserRepository adminUserRepository;
    private final SportRepository sportRepository;
    private final SlotService slotService;
    private final TwilioSmsService twilioSmsService;
    private final BookingNotificationService bookingNotificationService;

    private static final Set<String> SLOT_REQUIRED_ACTIVITIES = new HashSet<>(Set.of(
            "cricket",
            "pickleball",
            "swimming pool",
            "swimming"
    ));

    public PlayBoxUser getByCardUid(String cardUid) {
        return userRepo.findByCardUid(cardUid).orElse(null);
    }

    public PlayBoxUser createUser(PlayBoxUser user) {
        user.setCreatedAt(LocalDateTime.now().toString());
        user.setUpdatedAt(LocalDateTime.now().toString());
        user.setBalance(0f);
        return userRepo.save(user);
    }

    /* ---------------- ADD BALANCE ---------------- */

    public PlayBoxUser addBalance(String cardUid, float amount, String adminName) {
        PlayBoxUser user = getByCardUid(cardUid);

        float currentBalance = user.getBalance() == null ? 0f : user.getBalance();
        user.setBalance(currentBalance + amount);
        user.setUpdatedAt(LocalDateTime.now().toString());
       

        saveTransaction(user, "ADD", amount, adminName, "Balance added");
        PlayBoxUser savedUser = userRepo.save(user);
        sendSmsSafely(() -> twilioSmsService.sendBalanceAdded(savedUser.getPhone(), amount, savedUser.getBalance()));
        return savedUser;
    }

    /* ---------------- DEDUCT BALANCE ---------------- */

    @Transactional
    public PlayBoxUser deductBalance(
            String cardUid,
            float amount,
            String deductor,
            String description,
            Long sportId,
            Long slotId
    ) {
        PlayBoxUser user = getByCardUid(cardUid);
        Slot bookedSlot = null;
        String bookedSportName = null;
        String normalizedActivity = normalizeActivity(description);

        if (normalizedActivity.isEmpty()) {
            throw new RuntimeException("Activity description is required");
        }

        boolean requiresSlotSelection = SLOT_REQUIRED_ACTIVITIES.contains(normalizedActivity);
        if (requiresSlotSelection && slotId == null) {
            throw new RuntimeException("Slot selection is required for " + description);
        }

        float currentBalance = user.getBalance() == null ? 0f : user.getBalance();
        if (currentBalance < amount) {
            throw new RuntimeException("Insufficient Balance");
        }

        if (slotId != null) {
            Slot slot = slotRepository.findWithLockingById(slotId)
                    .orElseThrow(() -> new RuntimeException("Slot not found"));
            if (!slotService.isSwimmingSlotAllowed(slot.getSport(), slot.getStartTime())) {
                throw new RuntimeException("Swimming Pool slots are available only between 08:00 and 22:00");
            }
            boolean multiSlotSport = isMultiSlotSport(slot.getSport());

            if (!multiSlotSport && Boolean.TRUE.equals(slot.getBooked())) {
                throw new RuntimeException("Selected slot is already booked");
            }

            if (sportId != null && !sportId.equals(slot.getSport().getId())) {
                throw new RuntimeException("Selected slot does not belong to selected sport");
            }

            Booking booking = new Booking();
            booking.setUserId(user.getId());
            booking.setSportId(slot.getSport().getId());
            booking.setSlotId(slot.getId());
            booking.setAmount(amount);
            booking.setStatus("CONFIRMED");
            booking.setPaymentMode("WALLET");
            booking.setCreatedAt(Instant.now().toString());

            if (!multiSlotSport) {
                slot.setBooked(true);
                slotRepository.save(slot);
            }
            Booking savedBooking = bookingRepository.save(booking);
            bookedSlot = slot;
            bookedSportName = slot.getSport() != null ? slot.getSport().getName() : null;
            bookingNotificationService.notifyBookingCreated(savedBooking, user, slot.getSport(), slot);
        }

        user.setBalance(currentBalance - amount);
        user.setUpdatedAt(LocalDateTime.now().toString());

        saveTransaction(user, "DEDUCT", amount, deductor, description);
        PlayBoxUser savedUser = userRepo.save(user);
        if (bookedSlot != null) {
            Slot finalBookedSlot = bookedSlot;
            String finalBookedSportName = bookedSportName;
            sendSmsSafely(() -> twilioSmsService.sendBookingWithDeductionSummary(
                    savedUser.getPhone(),
                    finalBookedSportName,
                    finalBookedSlot.getSlotDate(),
                    finalBookedSlot.getStartTime(),
                    finalBookedSlot.getEndTime(),
                    amount,
                    savedUser.getBalance()
            ));
        } else {
            sendSmsSafely(() -> twilioSmsService.sendBalanceDeducted(savedUser.getPhone(), amount, savedUser.getBalance(), description));
        }
        return savedUser;
    }

    /* ---------------- TRANSACTION SAVE ---------------- */

    private void saveTransaction(
            PlayBoxUser user,
            String type,
            float amount,
            String adminName,
            String description
    ) {
        TransactionEntity tx = new TransactionEntity();

        tx.setUserId(user.getId());
        tx.setType(type);
        tx.setAmount(amount);
        tx.setBalanceAfter(user.getBalance());
        tx.setTimestamp(Instant.now());

        // ✅ NEW FIELDS
        tx.setAdminName(adminName);
        tx.setUserName(user.getName());        // null for ADD
        tx.setDescription(description);  // reason / note

        txRepo.save(tx);
    }

    /* ---------------- ADMIN USE CASES ---------------- */

    public List<PlayBoxUser> getAllUsers() {
        return userRepo.findAll();
    }

    public PlayBoxUser getByPhone(String phone) {
        return userRepo.findByPhone(phone);
    }

    public List<UserSummaryDTO> getAllUsersSummary() {
        List<PlayBoxUser> users = userRepo.findAll();
        
        return users.stream().map(user -> {
            UserSummaryDTO dto = new UserSummaryDTO();
            dto.setId(user.getId());
            dto.setName(user.getName());
            dto.setPhone(user.getPhone());
            dto.setEmail(user.getEmail());
            
            try {
                dto.setRegistrationDate(
                    LocalDateTime.parse(user.getCreatedAt())
                );
            } catch (Exception e) {
                dto.setRegistrationDate(null);
            }
            
            dto.setCurrentBalance(user.getBalance());
            
            // Calculate stats
            Double totalRecharge = txRepo.getTotalRecharge(user.getId());
            Double totalDeduction = txRepo.getTotalDeduction(user.getId());
            Long totalVisits = txRepo.getTotalVisits(user.getId());
            Instant lastVisit = txRepo.getLastVisit(user.getId()); // Now returns Instant
            
            dto.setTotalRecharge(totalRecharge != null ? totalRecharge : 0.0);
            dto.setTotalDeduction(totalDeduction != null ? totalDeduction : 0.0);
            dto.setTotalVisits(totalVisits != null ? totalVisits.intValue() : 0);
            dto.setLastVisit(lastVisit != null ? lastVisit.toString() : null); // Convert to String
            
            // Determine status (active if visited in last 30 days)
            String status = determineUserStatus(lastVisit);
            dto.setStatus(status);
            
            return dto;
        }).collect(Collectors.toList());
    }
    private String determineUserStatus(Instant lastVisit) {
        if (lastVisit == null) {
            return "inactive";
        }
        
        Instant thirtyDaysAgo = Instant.now().minusSeconds(30L * 24 * 60 * 60);
        return lastVisit.isAfter(thirtyDaysAgo) ? "active" : "inactive";
    }

    public UserDetailsDTO getUserDetails(Integer userId) {
        PlayBoxUser user = userRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserDetailsDTO dto = new UserDetailsDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setPhone(user.getPhone());
        dto.setEmail(user.getEmail());
        dto.setRegistrationDate(user.getCreatedAt());
        dto.setCurrentBalance(user.getBalance());
        
        // Calculate stats
        Double totalRecharge = txRepo.getTotalRecharge(userId);
        Double totalDeduction = txRepo.getTotalDeduction(userId);
        Long totalVisits = txRepo.getTotalVisits(userId);
        Instant lastVisit = txRepo.getLastVisit(userId); 
        
        dto.setTotalRecharge(totalRecharge != null ? totalRecharge : 0.0);
        dto.setTotalDeduction(totalDeduction != null ? totalDeduction : 0.0);
        dto.setTotalVisits(totalVisits != null ? totalVisits.intValue() : 0);
        dto.setLastVisit(lastVisit != null ? lastVisit.toString() : null); 
        // Calculate average visit amount
        if (totalVisits != null && totalVisits > 0 && totalDeduction != null) {
            dto.setAvgVisitAmount(totalDeduction / totalVisits);
        } else {
            dto.setAvgVisitAmount(0.0);
        }
        
        // Determine status
        dto.setStatus(determineUserStatus(lastVisit));
        
        // Get last recharge date
        String lastRechargeDate = getLastRechargeDate(userId);
        dto.setLastRechargeDate(lastRechargeDate);
        
        // Get recent transactions (last 10)
        List<TransactionEntity> recentTxs = txRepo.findTop10ByUserIdOrderByTimestampDesc(userId);
        List<TransactionDTO> txDTOs = recentTxs.stream()
            .map(this::convertToTransactionDTO)
            .collect(Collectors.toList());
        dto.setRecentTransactions(txDTOs);
        
        // Get recharge history
        List<RechargeHistoryDTO> rechargeHistory = getRechargeHistory(userId);
        dto.setRechargeHistory(rechargeHistory);
        
        return dto;
    }

    public UserStatsDTO getUserStats() {
        UserStatsDTO stats = new UserStatsDTO();
        
        // Total users
        List<PlayBoxUser> allUsers = userRepo.findAll();
        stats.setTotalUsers(allUsers.size());
        
        // Active users (visited in last 30 days)
        long activeUsers = allUsers.stream()
            .filter(user -> {
                Instant lastVisit = txRepo.getLastVisit(user.getId());
                return isActiveUser(lastVisit);
            })
            .count();
        stats.setActiveUsers((int) activeUsers);
        
        // Total recharge & deduction
        Double totalRecharge = 0.0;
        Double totalDeduction = 0.0;
        Double totalBalance = 0.0;
        
        for (PlayBoxUser user : allUsers) {
            Double recharge = txRepo.getTotalRecharge(user.getId());
            Double deduction = txRepo.getTotalDeduction(user.getId());
            
            if (recharge != null) totalRecharge += recharge;
            if (deduction != null) totalDeduction += deduction;
            
            totalBalance += user.getBalance();
        }
        
        stats.setTotalRecharge(totalRecharge);
        stats.setTotalDeduction(totalDeduction);
        stats.setAvgBalance(allUsers.isEmpty() ? 0.0 : totalBalance / allUsers.size());
        
        // New users today
        ZoneId IST = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(IST);
        Instant start = today.atStartOfDay(IST).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(IST).toInstant();
        
        long newUsersToday = allUsers.stream()
            .filter(user -> {
                try {
                    Instant userCreated = Instant.parse(user.getCreatedAt());
                    return !userCreated.isBefore(start) && userCreated.isBefore(end);
                } catch (Exception e) {
                    return false;
                }
            })
            .count();
        stats.setNewUsersToday((int) newUsersToday);
        
        return stats;
    }

    public List<UserSummaryDTO> searchUsers(String query) {
        List<PlayBoxUser> users = userRepo.searchUsers(query);
        
        return users.stream().map(user -> {
            UserSummaryDTO dto = new UserSummaryDTO();
            dto.setId(user.getId());
            dto.setName(user.getName());
            dto.setPhone(user.getPhone());
            dto.setEmail(user.getEmail());
            dto.setCurrentBalance(user.getBalance());
            dto.setRegistrationDate(
                LocalDateTime.parse(user.getCreatedAt())
            );
            
            // Basic stats
            Double totalRecharge = txRepo.getTotalRecharge(user.getId());
            Double totalDeduction = txRepo.getTotalDeduction(user.getId());
            Long totalVisits = txRepo.getTotalVisits(user.getId());
            Instant lastVisit = txRepo.getLastVisit(user.getId()); 
            
            dto.setTotalRecharge(totalRecharge != null ? totalRecharge : 0.0);
            dto.setTotalDeduction(totalDeduction != null ? totalDeduction : 0.0);
            dto.setTotalVisits(totalVisits != null ? totalVisits.intValue() : 0);
            dto.setLastVisit(lastVisit != null ? lastVisit.toString() : null); 
            dto.setStatus(determineUserStatus(lastVisit));
            
            return dto;
        }).collect(Collectors.toList());
    }

    /* ---------------- HELPER METHODS ---------------- */

    private String determineUserStatus(String lastVisit) {
        if (lastVisit == null || lastVisit.isEmpty()) {
            return "inactive";
        }
        
        try {
            Instant lastVisitInstant = Instant.parse(lastVisit);
            Instant thirtyDaysAgo = Instant.now().minusSeconds(30L * 24 * 60 * 60);
            
            return lastVisitInstant.isAfter(thirtyDaysAgo) ? "active" : "inactive";
        } catch (Exception e) {
            return "inactive";
        }
    }

    private boolean isActiveUser(Instant lastVisit) {
        if (lastVisit == null) {
            return false;
        }
        
        Instant thirtyDaysAgo = Instant.now().minusSeconds(30L * 24 * 60 * 60);
        return lastVisit.isAfter(thirtyDaysAgo);
    }
    private String getLastRechargeDate(Integer userId) {
        List<TransactionEntity> rechargeTxs = txRepo.findByUserIdAndTypeOrderByTimestampDesc(userId, "ADD");
        if (!rechargeTxs.isEmpty()) {
            return rechargeTxs.get(0).getTimestamp().toString();
        }
        return null;
    }

    private List<RechargeHistoryDTO> getRechargeHistory(Integer userId) {
        List<Object[]> results = txRepo.getRechargeHistory(userId);
        
        return results.stream()
            .map(r -> new RechargeHistoryDTO(
                r[0].toString(),  // date
                ((Number) r[1]).doubleValue()  // amount
            ))
            .collect(Collectors.toList());
    }

    private TransactionDTO convertToTransactionDTO(TransactionEntity tx) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(tx.getId());
        dto.setUserId(tx.getUserId());
        dto.setUserName(tx.getUserName());
        dto.setType(tx.getType());
        dto.setAmount(tx.getAmount());
        dto.setDescription(tx.getDescription());
        dto.setTimestamp(tx.getTimestamp().toString());
        dto.setAdminName(tx.getAdminName());
        dto.setBalanceAfter(tx.getBalanceAfter());
        return dto;
    }

    private String normalizeActivity(String activity) {
        if (activity == null) {
            return "";
        }
        return activity.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
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

    public PlayBoxUser updateUser(PlayBoxUser user) {
        PlayBoxUser existing = userRepo.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    
        existing.setName(user.getName());
        existing.setEmail(user.getEmail());
    
        return userRepo.save(existing);
    }

    @Transactional
    public PlayBoxUser cancelCard(String cardUid, String adminUsername, String adminPassword) {
        if (cardUid == null || cardUid.isBlank()) {
            throw new RuntimeException("Card UID is required");
        }
        if (adminUsername == null || adminUsername.isBlank()) {
            throw new RuntimeException("Admin username is required");
        }
        if (adminPassword == null || adminPassword.isBlank()) {
            throw new RuntimeException("Admin password is required");
        }

        AdminUser admin = adminUserRepository.findByUsername(adminUsername);
        if (admin == null || !adminPassword.equals(admin.getPassword())) {
            throw new RuntimeException("Invalid admin credentials");
        }

        PlayBoxUser user = userRepo.findByCardUid(cardUid)
                .orElseThrow(() -> new RuntimeException("User not found for card"));

        user.setCardUid(null);
        user.setUpdatedAt(LocalDateTime.now().toString());
        PlayBoxUser savedUser = userRepo.save(user);
        String blockedCardId = cardUid;
        sendSmsSafely(() -> twilioSmsService.sendCardBlocked(savedUser.getPhone(), blockedCardId));
        return savedUser;
    }

    @Transactional
    public PlayBoxUser assignCard(Integer userId, String cardUid) {
        if (userId == null) {
            throw new RuntimeException("User ID is required");
        }
        if (cardUid == null || cardUid.isBlank()) {
            throw new RuntimeException("Card UID is required");
        }

        PlayBoxUser existingCardOwner = getByCardUid(cardUid);
        if (existingCardOwner != null) {
            throw new RuntimeException("Card is already assigned to another user");
        }

        PlayBoxUser user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getCardUid() != null && !user.getCardUid().isBlank()) {
            throw new RuntimeException("User already has an assigned card");
        }

        user.setCardUid(cardUid);
        user.setUpdatedAt(LocalDateTime.now().toString());
        PlayBoxUser savedUser = userRepo.save(user);
        sendSmsSafely(() -> twilioSmsService.sendCardCreated(savedUser.getPhone(), cardUid));
        return savedUser;
    }

    private void sendSmsSafely(Runnable smsOperation) {
        try {
            smsOperation.run();
        } catch (Exception ignored) {
            // Do not fail business transaction if notification fails.
        }
    }
    
}
