package com.example.playbox.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDTO {
    private Integer totalUsers;
    private Integer activeUsers;
    private Double totalRecharge;
    private Double totalDeduction;
    private Double avgBalance;
    private Integer newUsersToday;
}