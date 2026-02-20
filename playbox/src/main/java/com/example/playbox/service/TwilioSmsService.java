package com.example.playbox.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import jakarta.annotation.PostConstruct;

@Service
public class TwilioSmsService {

    @Value("${twilio.enabled:false}")
    private boolean enabled;

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.phone-number:}")
    private String twilioPhoneNumber;

    private volatile boolean initialized;

    @PostConstruct
    public void init() {
        if (!enabled) {
            return;
        }

        if (isBlank(accountSid) || isBlank(authToken) || isBlank(twilioPhoneNumber)) {
            throw new RuntimeException("Twilio is enabled but credentials/phone number are missing");
        }

        Twilio.init(accountSid, authToken);
        initialized = true;
    }

    public void sendOtp(String phone, String otp) {
        sendSms(phone, "Your Elite Club OTP is " + otp + ". It is valid for 5 minutes.");
    }

    public void sendBalanceAdded(String phone, float amount, float newBalance) {
        sendSms(phone, "Elite Club: Rs. " + amount + " added to your wallet. New balance: Rs. " + newBalance + ".");
    }

    public void sendBalanceDeducted(String phone, float amount, float newBalance, String description) {
        String reason = isBlank(description) ? "Activity" : description;
        sendSms(phone, "Elite Club: Rs. " + amount + " deducted for " + reason + ". New balance: Rs. " + newBalance + ".");
    }

    public void sendBookingConfirmation(String phone, String sportName, String slotDate, String startTime, String endTime) {
        String sport = isBlank(sportName) ? "Sport" : sportName;
        sendSms(
                phone,
                "Elite Club booking confirmed for " + sport + " on " + slotDate + " at "
                        + toAmPm(startTime) + " - " + toAmPm(endTime) + "."
        );
    }

    public void sendBookingWithDeductionSummary(
            String phone,
            String sportName,
            String slotDate,
            String startTime,
            String endTime,
            float deductedAmount,
            float newBalance
    ) {
        String sport = isBlank(sportName) ? "Sport" : sportName;
        sendSms(
                phone,
                "Elite Club booking confirmed: " + sport + ", " + slotDate + " "
                        + toAmPm(startTime) + " - " + toAmPm(endTime)
                        + ". Deducted: Rs. " + deductedAmount
                        + ". Balance: Rs. " + newBalance + "."
        );
    }

    public void sendOfflineBookingOtp(
            String phone,
            String otp,
            String sportName,
            String slotDate,
            String startTime,
            String endTime
    ) {
        String sport = isBlank(sportName) ? "Sport" : sportName;
        sendSms(
                phone,
                "Elite Club booking OTP " + otp + " for " + sport + " on " + slotDate + " at "
                        + toAmPm(startTime) + " - " + toAmPm(endTime)
                        + ". Show this OTP at venue. Payment: OFFLINE."
        );
    }

    public void sendCardCreated(String phone, String cardUid) {
        sendSms(phone, "Elite Club: RFID card created successfully. Card ID: " + cardUid + ".");
    }

    public void sendCardBlocked(String phone, String cardUid) {
        sendSms(phone, "Elite Club: RFID card " + cardUid + " has been blocked. Contact support if this was not requested.");
    }

    public void sendSms(String phone, String message) {
        if (!enabled) {
            return;
        }

        if (!initialized) {
            init();
        }

        Message.creator(
                new PhoneNumber(normalizePhone(phone)),
                new PhoneNumber(twilioPhoneNumber),
                message
        ).create();
    }

    private String normalizePhone(String phone) {
        if (isBlank(phone)) {
            throw new RuntimeException("Phone number is missing");
        }

        String cleaned = phone.replaceAll("[^0-9+]", "").trim();
        if (cleaned.startsWith("+")) {
            return cleaned;
        }

        if (cleaned.length() == 10) {
            return "+91" + cleaned;
        }

        if (!cleaned.startsWith("+")) {
            return "+" + cleaned;
        }

        return cleaned;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String toAmPm(String time24) {
        if (isBlank(time24) || !time24.contains(":")) {
            return time24;
        }
        try {
            String[] parts = time24.split(":");
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);
            String suffix = hour >= 12 ? "PM" : "AM";
            int hour12 = hour % 12 == 0 ? 12 : hour % 12;
            return String.format("%02d:%02d %s", hour12, minute, suffix);
        } catch (Exception e) {
            return time24;
        }
    }
}
