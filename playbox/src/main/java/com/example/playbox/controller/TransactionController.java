package com.example.playbox.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.playbox.dto.DailyRevenueDashboardResponse;
import com.example.playbox.model.TransactionEntity;
import com.example.playbox.service.TransactionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    // 🔹 Get all transactions
    @GetMapping("/all")
    public List<TransactionEntity> getAll() {
        return transactionService.getAllTransactions();
    }

    // 🔹 Filtered transaction history
    @GetMapping("/filter")
    public List<TransactionEntity> filterTransactions(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String adminName,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        return transactionService.filter(userId, adminName, startDate, endDate);
    }

      @GetMapping("/daily")
    public DailyRevenueDashboardResponse getDailyDashboard() {
        return transactionService.getTodayDashboard();
    }
    @GetMapping("/user/{userId}")
public List<TransactionEntity> getUserTransactions(@PathVariable Integer userId) {
    return transactionService.getByUserId(userId);
}

}
