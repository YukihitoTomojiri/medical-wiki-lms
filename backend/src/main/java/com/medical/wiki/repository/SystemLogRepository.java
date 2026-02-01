package com.medical.wiki.repository;

import com.medical.wiki.entity.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    List<SystemLog> findTop100ByOrderByTimestampDesc();
    List<SystemLog> findAllByOrderByTimestampDesc();
}
