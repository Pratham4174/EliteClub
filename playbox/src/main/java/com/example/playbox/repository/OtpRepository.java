package com.example.playbox.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.playbox.model.OtpVerification;

public interface OtpRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByPhoneOrderByIdDesc(String phone);
}

