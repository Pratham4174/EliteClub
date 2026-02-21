package com.example.playbox.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.example.playbox.dto.AdminSportDayOverviewDTO;
import com.example.playbox.dto.AdminManualBookingRequest;
import com.example.playbox.dto.BookingRequest;
import com.example.playbox.model.Booking;
import com.example.playbox.repository.BookingRepository;
import com.example.playbox.service.BookingService;
import com.example.playbox.service.SlotService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final SlotService slotService;

    // 🔥 BOOK SLOT USING REQUEST BODY
    @PostMapping("/book")
    public Booking book(@RequestBody BookingRequest request) {

        if (request.getUserId() == null ||
            request.getSlotId() == null ||
            request.getPaymentMode() == null) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid booking request");
        }

        try {
            return bookingService.bookSlot(
                    request.getUserId(),
                    request.getSlotId(),
                    request.getPaymentMode()
            );
        } catch (Exception ex) {
            String msg = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
            if (msg.contains("already booked")
                    || msg.contains("lock wait timeout")
                    || msg.contains("deadlock")
                    || msg.contains("pessimistic")) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Slot already booked");
            }
            if (msg.contains("insufficient balance")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance");
            }
            if (msg.contains("elite card")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Get your Elite Card Now to reserve slots");
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Booking failed");
        }
    }

    @PostMapping("/admin/manual-book")
    public Booking adminManualBook(@RequestBody AdminManualBookingRequest request) {
        if (request.getName() == null || request.getName().isBlank()
                || request.getPhone() == null || request.getPhone().isBlank()
                || request.getSlotId() == null) {
            throw new RuntimeException("name, phone and slotId are required");
        }

        return bookingService.adminManualBookSlot(
                request.getName(),
                request.getPhone(),
                request.getEmail(),
                request.getSlotId()
        );
    }

    // 🔥 GET USER BOOKINGS
    @GetMapping("/user/{userId}")
    public List<Booking> getUserBookings(@PathVariable Integer userId) {
        return bookingRepository.findByUserId(userId);
    }

    @GetMapping("/admin/day-overview")
    public AdminSportDayOverviewDTO getSportDayOverview(
            @RequestParam Long sportId,
            @RequestParam String date
    ) {
        slotService.generateSlotsForDate(sportId, date);
        return bookingService.getSportDayOverview(sportId, date);
    }
}
