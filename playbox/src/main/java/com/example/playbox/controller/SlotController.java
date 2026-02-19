package com.example.playbox.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.playbox.dto.SlotDetailsDTO;
import com.example.playbox.model.Slot;
import com.example.playbox.repository.SlotRepository;
import com.example.playbox.service.SlotService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/slots")
@RequiredArgsConstructor
public class SlotController {

    private final SlotService slotService;
    private final SlotRepository slotRepository;

    @GetMapping
    public List<Slot> getSlots(
            @RequestParam Long sportId,
            @RequestParam String date
    ) {
        slotService.generateSlotsForDate(sportId, date);
        return slotRepository.findBySport_IdAndSlotDate(sportId, date);
    }

    @GetMapping("/{slotId}")
    public SlotDetailsDTO getSlotById(@PathVariable Long slotId) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        SlotDetailsDTO dto = new SlotDetailsDTO();
        dto.setId(slot.getId());
        dto.setSportId(slot.getSport().getId());
        dto.setSlotDate(slot.getSlotDate());
        dto.setStartTime(slot.getStartTime());
        dto.setEndTime(slot.getEndTime());
        dto.setBooked(slot.getBooked());
        return dto;
    }
}

