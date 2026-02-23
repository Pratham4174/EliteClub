package com.example.playbox.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.playbox.model.AdminUser;
import com.example.playbox.model.Booking;
import com.example.playbox.model.BookingNotification;
import com.example.playbox.model.PlayBoxUser;
import com.example.playbox.model.Slot;
import com.example.playbox.model.Sport;
import com.example.playbox.repository.AdminUserRepository;
import com.example.playbox.repository.BookingNotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingNotificationService {

    private final BookingNotificationRepository notificationRepository;
    private final AdminUserRepository adminUserRepository;
    private final TwilioSmsService twilioSmsService;

    @Transactional
    public void notifyBookingCreated(Booking booking, PlayBoxUser user, Sport sport, Slot slot) {
        BookingNotification notification = new BookingNotification();
        notification.setBookingId(booking.getId());
        notification.setUserId(user.getId());
        notification.setUserName(user.getName());
        notification.setUserPhone(user.getPhone());
        notification.setSportName(sport.getName());
        notification.setSlotDate(slot.getSlotDate());
        notification.setStartTime(slot.getStartTime());
        notification.setEndTime(slot.getEndTime());
        notification.setRemarks(booking.getRemarks());
        notification.setSeen(false);
        notification.setCreatedAt(Instant.now().toString());
        notification.setMessage(
                "New booking: " + safe(user.getName()) + " (" + safe(user.getPhone()) + ") | "
                        + safe(sport.getName()) + " | "
                        + safe(slot.getSlotDate()) + " "
                        + safe(slot.getStartTime()) + " - " + safe(slot.getEndTime())
        );
        notificationRepository.save(notification);

        sendAdminSms(notification.getMessage());
    }

    @Transactional(readOnly = true)
    public List<BookingNotification> getAll() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public BookingNotification markSeen(Long id) {
        BookingNotification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setSeen(true);
        return notificationRepository.save(notification);
    }

    private void sendAdminSms(String message) {
        List<AdminUser> admins = adminUserRepository.findAll();
        for (AdminUser admin : admins) {
            String role = safe(admin.getRole()).toUpperCase(Locale.ROOT);
            boolean shouldNotify = role.contains("OWNER") || role.contains("STAFF") || role.contains("ADMIN");
            if (!shouldNotify) {
                continue;
            }

            String targetPhone = admin.getPhone();
            if (targetPhone == null || targetPhone.isBlank()) {
                // Backward-compatible fallback: if username is numeric, use it as phone.
                String maybePhone = safe(admin.getUsername()).replaceAll("[^0-9]", "");
                if (maybePhone.length() == 10) {
                    targetPhone = maybePhone;
                }
            }
            if (targetPhone == null || targetPhone.isBlank()) {
                continue;
            }

            try {
                twilioSmsService.sendSms(targetPhone, "Elite Club Admin Alert: " + message);
            } catch (Exception ignored) {
                // never fail booking due to SMS failure
            }
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
