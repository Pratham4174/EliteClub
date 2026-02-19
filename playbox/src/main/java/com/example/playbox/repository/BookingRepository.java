package com.example.playbox.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.playbox.model.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Integer userId);
    List<Booking> findBySlotIdInAndStatus(List<Long> slotIds, String status);
}
