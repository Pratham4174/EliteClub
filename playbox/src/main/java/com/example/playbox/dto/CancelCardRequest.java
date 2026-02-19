package com.example.playbox.dto;

import lombok.Data;

@Data
public class CancelCardRequest {
    private String cardUid;
    private String adminUsername;
    private String adminPassword;
}
