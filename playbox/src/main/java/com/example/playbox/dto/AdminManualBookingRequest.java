package com.example.playbox.dto;

import lombok.Data;

@Data
public class AdminManualBookingRequest {
    private String name;
    private String phone;
    private Long slotId;
}

