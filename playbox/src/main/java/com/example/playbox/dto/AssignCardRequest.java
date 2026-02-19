package com.example.playbox.dto;

import lombok.Data;

@Data
public class AssignCardRequest {
    private Integer userId;
    private String cardUid;
}
