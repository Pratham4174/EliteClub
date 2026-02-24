package com.example.playbox.service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

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

        // Swimming Pool only: 08:00 AM to 10:00 PM (last slot 21:00-22:00)
        int startHour = isSwimmingSport(sport) ? 8 : 0;
        int endExclusive = isSwimmingSport(sport) ? 22 : 24;
        for (int hour = startHour; hour < endExclusive; hour++) {

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

    @Transactional(readOnly = true)
    public List<Slot> getVisibleSlotsForDate(Long sportId, String date) {
        Sport sport = sportRepository.findById(sportId)
                .orElseThrow(() -> new RuntimeException("Sport not found"));

        List<Slot> slots = slotRepository.findBySport_IdAndSlotDate(sportId, date);
        if (!isSwimmingSport(sport)) {
            return slots;
        }

        return slots.stream()
                .filter(slot -> isSwimmingHourAllowed(slot.getStartTime()))
                .sorted(Comparator.comparing(Slot::getStartTime))
                .collect(Collectors.toList());
    }

    public boolean isSwimmingSlotAllowed(Sport sport, String startTime) {
        if (!isSwimmingSport(sport)) {
            return true;
        }
        return isSwimmingHourAllowed(startTime);
    }

    private boolean isSwimmingSport(Sport sport) {
        if (sport == null || sport.getName() == null) {
            return false;
        }
        String name = sport.getName().trim().toLowerCase(Locale.ROOT);
        return name.contains("swimming");
    }

    private boolean isSwimmingHourAllowed(String startTime) {
        if (startTime == null || startTime.isBlank()) {
            return false;
        }
        String[] parts = startTime.split(":");
        if (parts.length < 2) {
            return false;
        }
        try {
            int hour = Integer.parseInt(parts[0]);
            return hour >= 8 && hour < 22;
        } catch (NumberFormatException ex) {
            return false;
        }
    }
}

