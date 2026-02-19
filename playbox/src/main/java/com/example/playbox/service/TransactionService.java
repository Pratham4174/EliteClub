package com.example.playbox.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.playbox.dto.DailyRevenueDashboardResponse;
import com.example.playbox.model.TransactionEntity;
import com.example.playbox.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepo;

    public List<TransactionEntity> getAllTransactions() {
        return transactionRepo.findAll();
    }

    public List<TransactionEntity> getByUser(Integer userId) {
        return transactionRepo.findByUserId(userId);
    }

    public List<TransactionEntity> getByStaff(String adminName) {
        return transactionRepo.findByAdminName(adminName);
    }

    public List<TransactionEntity> getByDateRange(String start, String end) {
        return transactionRepo.findByTimestampBetween(start, end);
    }

    public List<TransactionEntity> filter(
            Integer userId,
            String adminName,
            String start,
            String end
    ) {
        if (userId != null && adminName != null && start != null && end != null) {
            return transactionRepo
                    .findByUserIdAndAdminNameAndTimestampBetween(userId, adminName, start, end);
        }

        if (userId != null && adminName != null) {
            return transactionRepo.findByUserIdAndAdminName(userId, adminName);
        }

        if (userId != null && start != null && end != null) {
            return transactionRepo.findByUserIdAndTimestampBetween(userId, start, end);
        }

        if (adminName != null) {
            return transactionRepo.findByAdminName(adminName);
        }
           if (start != null && end != null) {
            // DATE ONLY FILTER - THIS WAS MISSING!
            return transactionRepo.findByTimestampBetween(start, end);
        }

        if (userId != null) {
            return transactionRepo.findByUserId(userId);
        }

        return transactionRepo.findAll();
    }
     public DailyRevenueDashboardResponse getTodayDashboard() {

        ZoneId IST = ZoneId.of("Asia/Kolkata");

        LocalDate today = LocalDate.now(IST);
        
        Instant start = today.atStartOfDay(IST).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(IST).toInstant();
        


        Double totalAdded = transactionRepo.totalAddedToday(start, end);
        Double totalDeducted = transactionRepo.totalDeductedToday(start, end);

        List<Object[]> staffRaw = transactionRepo.mostActiveStaff(start, end);
        List<Object[]> userRaw = transactionRepo.mostActiveUsers(start, end);

        DailyRevenueDashboardResponse response = new DailyRevenueDashboardResponse();
        response.setTotalDeposited(totalAdded);
        response.setTotalDeducted(totalDeducted);
        response.setNetCashflow(totalAdded - totalDeducted);

        response.setMostActiveStaff(
            staffRaw.stream()
                .map(r -> new DailyRevenueDashboardResponse.StatItem(
                        (String) r[0],
                        (Long) r[1]
                ))
                .toList()
        );

        response.setMostActiveUsers(
            userRaw.stream()
                .map(r -> new DailyRevenueDashboardResponse.StatItem(
                        (String) r[0],
                        (Long) r[1]
                ))
                .toList()
        );

        return response;
    }

    public List<TransactionEntity> getByUserId(Integer userId) {
        return transactionRepo.findByUserId(userId);
    }
    
}
