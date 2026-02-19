package com.example.playbox.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDTO {
    private Integer id;
    private String name;
    private String phone;
    private String email;
    private LocalDateTime registrationDate;
    private String lastVisit;
    private Integer totalVisits;
    private Double totalRecharge;
    private Double totalDeduction;
    private Float currentBalance;
    private String status;
}