package com.example.playbox.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {
    private Integer id;
    private Integer userId;
    private String userName;
    private String type; // ADD, DEDUCT, NEW_USER
    private Float amount;
    private String description;
    private String timestamp;
    private String adminName;
    private Float balanceAfter;
}