package com.example.playbox.model;


import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "PlayboxTransactions")
public class TransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "user_name")  // ADD THIS FIELD
    private String userName;

    @Column(nullable = false, length = 20)
    private String type; // ADD / DEDUCT

    @Column(nullable = false)
    private Float amount;

    @Column(name = "balance_after", nullable = false)
    private Float balanceAfter;
    
    private String adminName; 
    private String description;

    private Instant timestamp;
}
