package com.example.playbox.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.playbox.model.TransactionEntity;

public interface TransactionRepository extends JpaRepository<TransactionEntity, Integer> {
    
    // Non-paginated versions (existing)
    List<TransactionEntity> findByUserId(Integer userId);
    List<TransactionEntity> findByAdminName(String adminName);
    List<TransactionEntity> findByTimestampBetween(String start, String end);
    List<TransactionEntity> findByUserIdAndAdminName(Integer userId, String adminName);
    List<TransactionEntity> findByUserIdAndTimestampBetween(Integer userId, String start, String end);
    List<TransactionEntity> findByAdminNameAndTimestampBetween(String adminName, String start, String end);
    List<TransactionEntity> findByUserIdAndAdminNameAndTimestampBetween(
        Integer userId, String adminName, String start, String end);
    
    // Paginated versions (NEW - must add these)
    Page<TransactionEntity> findByUserId(Integer userId, Pageable pageable);
    Page<TransactionEntity> findByAdminName(String adminName, Pageable pageable);
    Page<TransactionEntity> findByTimestampBetween(String start, String end, Pageable pageable);
    Page<TransactionEntity> findByUserIdAndAdminName(Integer userId, String adminName, Pageable pageable);
    Page<TransactionEntity> findByUserIdAndTimestampBetween(
        Integer userId, String start, String end, Pageable pageable);
    Page<TransactionEntity> findByAdminNameAndTimestampBetween(
        String adminName, String start, String end, Pageable pageable);
    Page<TransactionEntity> findByUserIdAndAdminNameAndTimestampBetween(
        Integer userId, String adminName, String start, String end, Pageable pageable);

        @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM TransactionEntity t
        WHERE t.type = 'ADD'
        AND t.timestamp >= :start
        AND t.timestamp <= :end
    """)
    Double totalAddedToday(Instant start, Instant end);

    // Total deducted today
    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM TransactionEntity t
        WHERE t.type = 'DEDUCT'
        AND t.timestamp >= :start
        AND t.timestamp <= :end
    """)
    Double totalDeductedToday(Instant start, Instant end);

    // Most active staff (by number of transactions)
    @Query("""
        SELECT t.adminName, COUNT(t.id)
        FROM TransactionEntity t
        WHERE t.timestamp >= :start
        AND t.timestamp <= :end
        GROUP BY t.adminName
        ORDER BY COUNT(t.id) DESC
    """)
    List<Object[]> mostActiveStaff(Instant start, Instant end);

    // Most active users
    @Query("""
        SELECT t.userName, COUNT(t.id)
        FROM TransactionEntity t
        WHERE t.timestamp >= :start
        AND t.timestamp <= :end
        GROUP BY t.userName
        ORDER BY COUNT(t.id) DESC
    """)
    List<Object[]> mostActiveUsers(Instant start, Instant end);

    @Query("""
  SELECT COALESCE(SUM(t.amount), 0)
  FROM TransactionEntity t
  WHERE t.userId = :userId AND t.type = 'ADD'
""")
Double getTotalRecharge(@Param("userId") Integer userId);

@Query("""
  SELECT COALESCE(SUM(t.amount), 0)
  FROM TransactionEntity t
  WHERE t.userId = :userId AND t.type = 'DEDUCT'
""")
Double getTotalDeduction(@Param("userId") Integer userId);

@Query("""
  SELECT COUNT(t)
  FROM TransactionEntity t
  WHERE t.userId = :userId AND t.type = 'DEDUCT'
""")
Long getTotalVisits(@Param("userId") Integer userId);


// In TransactionRepository.java
@Query("""
    SELECT MAX(t.timestamp)
    FROM TransactionEntity t
    WHERE t.userId = :userId AND t.type = 'DEDUCT'
""")
Instant getLastVisit(@Param("userId") Integer userId);

List<TransactionEntity> findTop10ByUserIdOrderByTimestampDesc(Integer userId);

@Query("""
  SELECT DATE(t.timestamp), SUM(t.amount)
  FROM TransactionEntity t
  WHERE t.userId = :userId AND t.type = 'ADD'
  GROUP BY DATE(t.timestamp)
  ORDER BY DATE(t.timestamp)
""")
List<Object[]> getRechargeHistory(@Param("userId") Integer userId);

// Find ADD transactions for a user, ordered by timestamp
List<TransactionEntity> findByUserIdAndTypeOrderByTimestampDesc(Integer userId, String type);


}