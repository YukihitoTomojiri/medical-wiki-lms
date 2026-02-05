package com.medical.wiki.repository;

import com.medical.wiki.entity.Progress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProgressRepository extends JpaRepository<Progress, Long> {
    List<Progress> findByUserId(Long userId);

    List<Progress> findByUserIdOrderByReadAtDesc(Long userId);

    List<Progress> findByManualId(Long manualId);

    Optional<Progress> findByUserIdAndManualId(Long userId, Long manualId);

    boolean existsByUserIdAndManualId(Long userId, Long manualId);

    void deleteByUserId(Long userId);

    // Compliance export queries
    List<Progress> findByUserIdAndReadAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    List<Progress> findByUserIdIn(List<Long> userIds);

    @org.springframework.data.jpa.repository.Query("SELECT p.manual.id, COUNT(p) FROM Progress p WHERE p.readAt IS NOT NULL AND p.user.deletedAt IS NULL GROUP BY p.manual.id")
    List<Object[]> countCompletionsPerManual();
}
