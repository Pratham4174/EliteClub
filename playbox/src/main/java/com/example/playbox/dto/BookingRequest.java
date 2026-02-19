package com.example.playbox.dto;


import lombok.Data;

@Data
public class BookingRequest {

    private Integer userId;
    private Long slotId;
    private String paymentMode;
}
