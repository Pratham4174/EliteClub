package com.example.playbox.dto;

public record UserResponse(
        Integer id,
        String name,
        String cardUid,
        float balance
) {}
