package com.example.playbox.controller;


import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.playbox.dto.UserDetailsDTO;
import com.example.playbox.dto.UserStatsDTO;
import com.example.playbox.dto.UserSummaryDTO;
import com.example.playbox.dto.CancelCardRequest;
import com.example.playbox.dto.AssignCardRequest;
import com.example.playbox.model.PlayBoxUser;
import com.example.playbox.service.UserServiceImpl;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserServiceImpl userService;

    @GetMapping("/card/{cardUid}")
    public PlayBoxUser getByCard(@PathVariable String cardUid) {
        return userService.getByCardUid(cardUid);
    }

    @PostMapping("/create")
    public PlayBoxUser create(@RequestBody PlayBoxUser user) {
        return userService.createUser(user);
    }

    @PostMapping("/add")
    public PlayBoxUser addBalance(
            @RequestParam String cardUid,
            @RequestParam float amount,
            @RequestParam String adminName
    ) {
        return userService.addBalance(cardUid, amount, adminName);
    }

    @PostMapping("/deduct")
    public PlayBoxUser deductBalance(
            @RequestParam String cardUid,
            @RequestParam float amount,
            @RequestParam String deductor,
            @RequestParam String description,
            @RequestParam(required = false) Long sportId,
            @RequestParam(required = false) Long slotId
    ) {
        return userService.deductBalance(cardUid, amount, deductor, description, sportId, slotId);
    }
    

    @GetMapping("/all")
   public List<PlayBoxUser> getAllUsers() {
    return userService.getAllUsers();
}

@GetMapping("/phone/{phone}")
public PlayBoxUser getByPhone(@PathVariable String phone) {
    return userService.getByPhone(phone);
}
@GetMapping("/all-summary")
    public List<UserSummaryDTO> getAllUsersSummary() {
        return userService.getAllUsersSummary();
    }

    /**
     * Get user details by ID including lifetime stats
     */
    @GetMapping("/{userId}/details")
    public UserDetailsDTO getUserDetails(@PathVariable Integer userId) {
        return userService.getUserDetails(userId);
    }

    /**
     * Get overall user statistics
     */
    @GetMapping("/stats")
    public UserStatsDTO getUserStats() {
        return userService.getUserStats();
    }

    /**
     * Search users by name, ID, phone, or email
     */
    @GetMapping("/search")
    public List<UserSummaryDTO> searchUsers(@RequestParam String q) {
        return userService.searchUsers(q);
    }

@PutMapping("/update")
public PlayBoxUser updateUser(@RequestBody PlayBoxUser updatedUser) {
    return userService.updateUser(updatedUser);
}

@PostMapping("/cancel-card")
public PlayBoxUser cancelCard(@RequestBody CancelCardRequest request) {
    if (request.getCardUid() == null || request.getAdminUsername() == null || request.getAdminPassword() == null) {
        throw new RuntimeException("cardUid, adminUsername and adminPassword are required");
    }
    return userService.cancelCard(
            request.getCardUid(),
            request.getAdminUsername(),
            request.getAdminPassword()
    );
}

@PostMapping("/assign-card")
public PlayBoxUser assignCard(@RequestBody AssignCardRequest request) {
    if (request.getUserId() == null || request.getCardUid() == null) {
        throw new RuntimeException("userId and cardUid are required");
    }
    return userService.assignCard(request.getUserId(), request.getCardUid());
}

}
