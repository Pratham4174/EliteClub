package com.example.playbox.dto;

import java.util.List;

import lombok.Data;

@Data
public class DailyRevenueDashboardResponse {

    private Double totalDeposited;
    private Double totalDeducted;
    private Double netCashflow;

    private List<StatItem> mostActiveStaff;
    private List<StatItem> mostActiveUsers;

    @Data
    public static class StatItem {
        private String name;
        private Long count;

        public StatItem(String name, Long count) {
            this.name = name;
            this.count = count;
        }
    }
}
