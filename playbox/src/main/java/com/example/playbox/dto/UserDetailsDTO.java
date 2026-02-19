package com.example.playbox.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailsDTO {
    private Integer id;
    private String name;
    private String phone;
    private String email;
    private String registrationDate;
    private String lastVisit;
    private Integer totalVisits;
    private Double totalRecharge;
    private Double totalDeduction;
    private Float currentBalance;
    private String status;
    private Double avgVisitAmount;
    private String lastRechargeDate;
    
    // Recent transactions
    private List<TransactionDTO> recentTransactions;
    
    // Recharge history
    private List<RechargeHistoryDTO> rechargeHistory;
}
