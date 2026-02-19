package com.example.playbox.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserRequest {

    @NotBlank
    private String cardUid;

    @NotBlank
    private String name;

    @NotBlank
    private String phone;

    private String email;
}
