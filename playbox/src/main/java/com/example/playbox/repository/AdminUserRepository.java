package com.example.playbox.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.playbox.model.AdminUser;

public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
    AdminUser findByUsername(String username);
}
