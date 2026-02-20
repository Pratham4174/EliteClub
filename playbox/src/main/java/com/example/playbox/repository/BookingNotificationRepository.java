package com.example.playbox.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.playbox.model.BookingNotification;

public interface BookingNotificationRepository extends JpaRepository<BookingNotification, Long> {
    List<BookingNotification> findAllByOrderByCreatedAtDesc();
}

