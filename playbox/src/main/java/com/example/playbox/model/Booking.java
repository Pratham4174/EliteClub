package com.example.playbox.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer userId;

    private Long sportId;

    private Long slotId;

    private Float amount;

    private String status; // CONFIRMED / CANCELLED

    private String paymentMode; // WALLET / CASH / ONLINE

    private String createdAt;
}

