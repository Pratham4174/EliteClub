package com.example.playbox.repository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.playbox.model.PlayBoxUser;

public interface PlayBoxUserRepository extends JpaRepository<PlayBoxUser, Integer> {

    Optional<PlayBoxUser> findByCardUid(String cardUid);
    PlayBoxUser findByPhone(String phone);

     @Query("SELECT u FROM PlayBoxUser u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "CAST(u.id AS string) LIKE CONCAT('%', :query, '%') OR " +
           "u.phone LIKE CONCAT('%', :query, '%') OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<PlayBoxUser> searchUsers(@Param("query") String query);

}