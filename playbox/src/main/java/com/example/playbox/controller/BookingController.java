package com.example.playbox.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.playbox.dto.AdminSportDayOverviewDTO;
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

            throw new RuntimeException("Invalid booking request");
        }

        return bookingService.bookSlot(
                request.getUserId(),
                request.getSlotId(),
                request.getPaymentMode()
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
