package com.example.playbox.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.playbox.model.Slot;

public interface SlotRepository extends JpaRepository<Slot, Long> {

    List<Slot> findBySport_IdAndSlotDate(Long sportId, String slotDate);

    @Query(value = "SELECT * FROM Slot WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<Slot> findWithLockingById(@Param("id") Long id);

}
