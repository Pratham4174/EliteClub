package com.example.playbox.dto;

import java.util.List;

import lombok.Data;

@Data
public class AdminSportDayOverviewDTO {
    private Long sportId;
    private String sportName;
    private String courtName;
    private String date;
    private int totalSlots;
    private int bookedSlots;
    private int emptySlots;
    private List<AdminSlotStatusDTO> slots;
}
