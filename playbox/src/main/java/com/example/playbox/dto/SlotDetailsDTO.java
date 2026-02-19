package com.example.playbox.dto;

import lombok.Data;

@Data
public class SlotDetailsDTO {
    private Long id;
    private Long sportId;
    private String slotDate;
    private String startTime;
    private String endTime;
    private Boolean booked;
}
