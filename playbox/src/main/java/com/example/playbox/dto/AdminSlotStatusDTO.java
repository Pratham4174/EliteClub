package com.example.playbox.dto;

import lombok.Data;

@Data
public class AdminSlotStatusDTO {
    private Long slotId;
    private String slotDate;
    private String startTime;
    private String endTime;
    private boolean booked;

    private Long bookingId;
    private Integer userId;
    private String userName;
    private Float amount;
    private String status;
    private String paymentMode;
    private String createdAt;
}
