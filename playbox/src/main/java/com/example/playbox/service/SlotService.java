package com.example.playbox.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.playbox.model.Slot;
import com.example.playbox.model.Sport;
import com.example.playbox.repository.SlotRepository;
import com.example.playbox.repository.SportRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SlotService {

    private final SlotRepository slotRepository;
    private final SportRepository sportRepository;

    @Transactional
    public void generateSlotsForDate(Long sportId, String date) {

        // 🔹 Fetch sport entity
        Sport sport = sportRepository.findById(sportId)
                .orElseThrow(() -> new RuntimeException("Sport not found"));

        // 🔹 Check if slots already exist
        List<Slot> existing =
                slotRepository.findBySport_IdAndSlotDate(sportId, date);

        if (!existing.isEmpty()) {
            return;
        }

        // 🔹 Generate 24 slots (24/7 arena)
        for (int hour = 0; hour < 24; hour++) {

            String startTime = String.format("%02d:00", hour);
            String endTime = String.format("%02d:00", (hour + 1) % 24);

            Slot slot = new Slot();
            slot.setSport(sport);   // ✅ IMPORTANT FIX
            slot.setSlotDate(date);
            slot.setStartTime(startTime);
            slot.setEndTime(endTime);
            slot.setBooked(false);

            slotRepository.save(slot);
        }
    }
}


