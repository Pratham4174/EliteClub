package com.example.playbox.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "BookingNotification")
public class BookingNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long bookingId;
    private Integer userId;
    private String userName;
    private String userPhone;
    private String sportName;
    private String slotDate;
    private String startTime;
    private String endTime;
    private String message;
    private Boolean seen;
    private String createdAt;
}

