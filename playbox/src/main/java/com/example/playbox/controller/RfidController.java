package com.example.playbox.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.playbox.dto.RfidScanRequest;
import com.example.playbox.dto.RfidScanResponse;
import com.example.playbox.model.PlayBoxUser;
import com.example.playbox.service.UserServiceImpl;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/rfid")
@RequiredArgsConstructor
public class RfidController {

    private final UserServiceImpl userService;

    @PostMapping("/scan")
    public RfidScanResponse scan(@RequestBody RfidScanRequest request) {

        PlayBoxUser user = userService.getByCardUid(request.getCardUid());

        if (user == null) {
            return RfidScanResponse.builder()
                    .status("NEW_CARD")
                    .build();
        }

        return RfidScanResponse.builder()
                .status("EXISTING_USER")
                .name(user.getName())
                .balance(user.getBalance())
                .build();
    }
}
