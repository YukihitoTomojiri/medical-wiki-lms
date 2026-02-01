package com.medical.wiki.repository;

import com.medical.wiki.entity.SecurityAnomaly;
import com.medical.wiki.entity.SecurityAnomaly.AnomalyType;
import com.medical.wiki.entity.SecurityAnomaly.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SecurityAnomalyRepository extends JpaRepository<SecurityAnomaly, Long> {

    List<SecurityAnomaly> findAllByOrderByDetectedAtDesc();

    List<SecurityAnomaly> findByStatusOrderByDetectedAtDesc(Status status);

    List<SecurityAnomaly> findTop50ByOrderByDetectedAtDesc();

    @Query("SELECT COUNT(s) FROM SecurityAnomaly s WHERE s.userId = :userId AND s.type = :type AND s.detectedAt > :since")
    long countByUserIdAndTypeAndDetectedAtAfter(
            @Param("userId") Long userId,
            @Param("type") AnomalyType type,
            @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(s) FROM SecurityAnomaly s WHERE s.status = 'OPEN'")
    long countOpenAlerts();

    @Query("SELECT COUNT(s) FROM SecurityAnomaly s WHERE s.status = 'OPEN' AND s.severity IN ('HIGH', 'CRITICAL')")
    long countCriticalOpenAlerts();
}
