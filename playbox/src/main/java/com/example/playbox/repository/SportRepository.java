package com.example.playbox.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.playbox.model.Sport;

public interface SportRepository extends JpaRepository<Sport, Long> {

    
}
