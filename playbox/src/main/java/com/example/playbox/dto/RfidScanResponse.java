package com.example.playbox.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RfidScanResponse {
    private String status;
    private String name;
    private Float balance;
}
