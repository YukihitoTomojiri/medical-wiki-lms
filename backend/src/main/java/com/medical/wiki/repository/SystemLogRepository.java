package com.medical.wiki.repository;

import com.medical.wiki.entity.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    List<SystemLog> findTop100ByOrderByTimestampDesc();

    List<SystemLog> findAllByOrderByTimestampDesc();

    long countByPerformedByAndActionAndTimestampAfter(String performedBy, String action, LocalDateTime timestamp);

    List<SystemLog> findTop3ByPerformedByOrderByTimestampDesc(String performedBy);
}
