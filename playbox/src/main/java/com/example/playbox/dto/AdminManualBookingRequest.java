package com.example.playbox.dto;

import lombok.Data;

@Data
public class AdminManualBookingRequest {
    private String name;
    private String phone;
    private String email;
    private Long slotId;
}
