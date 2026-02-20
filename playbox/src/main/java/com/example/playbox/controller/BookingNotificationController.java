package com.example.playbox.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.playbox.model.BookingNotification;
import com.example.playbox.service.BookingNotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class BookingNotificationController {

    private final BookingNotificationService bookingNotificationService;

    @GetMapping("/bookings")
    public List<BookingNotification> getBookingNotifications() {
        return bookingNotificationService.getAll();
    }

    @PostMapping("/bookings/{id}/seen")
    public BookingNotification markBookingNotificationSeen(@PathVariable Long id) {
        return bookingNotificationService.markSeen(id);
    }
}

