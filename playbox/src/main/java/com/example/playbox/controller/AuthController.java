package com.example.playbox.controller;

import java.util.Map;
import java.util.Locale;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.playbox.model.OtpVerification;
import com.example.playbox.model.PlayBoxUser;
import com.example.playbox.repository.OtpRepository;
import com.example.playbox.repository.PlayBoxUserRepository;
import com.example.playbox.service.TwilioSmsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final PlayBoxUserRepository userRepository;
    private final OtpRepository otpRepository;
    private final TwilioSmsService twilioSmsService;

    // =========================
    // STEP 1 - SEND OTP
    // =========================
    @PostMapping("/send-otp")
    public String sendOtp(@RequestBody Map<String, String> request) {

        String phone = request.get("phone");

        if (phone == null || phone.isBlank()) {
            throw new RuntimeException("Phone number required");
        }

        String otp = String.valueOf((int)(Math.random() * 9000) + 1000);

        OtpVerification record = new OtpVerification();
        record.setPhone(phone);
        record.setOtp(otp);
        record.setVerified(false);
        record.setCreatedAt(java.time.Instant.now().toString());

        otpRepository.save(record);
        try {
            twilioSmsService.sendOtp(phone, otp);
        } catch (Exception ex) {
            String message = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase(Locale.ROOT);
            if (message.contains("unverified") || message.contains("trial")) {
                throw new RuntimeException(
                        "Twilio trial account can send OTP only to verified numbers. Verify this number in Twilio Console or upgrade Twilio account."
                );
            }
            throw new RuntimeException("Failed to send OTP: " + ex.getMessage());
        }
        return "OTP sent successfully";
    }

    // =========================
    // STEP 2 - VERIFY OTP
    // =========================
    @PostMapping("/verify-otp")
    public PlayBoxUser verifyOtp(@RequestBody Map<String, String> request) {

        String phone = request.get("phone");
        String otp = request.get("otp");
        String name = request.get("name");

        if (phone == null || otp == null) {
            throw new RuntimeException("Phone and OTP required");
        }

        OtpVerification record = otpRepository
                .findTopByPhoneOrderByIdDesc(phone)
                .orElseThrow(() -> new RuntimeException("OTP not found"));

        if (!record.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        record.setVerified(true);
        otpRepository.save(record);

        // 🔍 Check if user exists
        PlayBoxUser user = userRepository.findByPhone(phone);

        if (user != null) {
            // Safety: clear legacy auto-generated placeholder card ids from old builds.
            if (isLegacyAutoCard(user.getCardUid())) {
                user.setCardUid(null);
                user = userRepository.save(user);
            }
            return user; // LOGIN
        }

        // 🆕 Create new user (SIGNUP)
        if (name == null || name.isBlank()) {
            throw new RuntimeException("Name is required for new user signup");
        }

        PlayBoxUser newUser = new PlayBoxUser();
        newUser.setPhone(phone);
        newUser.setName(name.trim());
        newUser.setBalance(0f);

        // New player account starts without RFID card; admin assigns it later.
        newUser.setCardUid(null);

        newUser.setCreatedAt(java.time.Instant.now().toString());

        return userRepository.save(newUser);
    }

    private boolean isLegacyAutoCard(String cardUid) {
        if (cardUid == null) {
            return false;
        }
        return cardUid.trim().toUpperCase(Locale.ROOT).startsWith("CARD-");
    }
}
