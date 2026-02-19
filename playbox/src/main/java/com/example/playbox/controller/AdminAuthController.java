package com.example.playbox.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.playbox.model.AdminUser;
import com.example.playbox.repository.AdminUserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminUserRepository adminRepo;

    @PostMapping("/login")
    public AdminUser login(@RequestBody AdminUser req) {

        AdminUser admin = adminRepo.findByUsername(req.getUsername());

        if (admin == null || !admin.getPassword().equals(req.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        return admin; // frontend will store this in localStorage
    }
}
