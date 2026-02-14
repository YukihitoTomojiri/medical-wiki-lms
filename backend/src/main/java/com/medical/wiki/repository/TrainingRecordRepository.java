package com.medical.wiki.repository;

import com.medical.wiki.entity.TrainingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TrainingRecordRepository extends JpaRepository<TrainingRecord, Long> {

    Optional<TrainingRecord> findByAnnouncementIdAndUserId(Long announcementId, Long userId);

    List<TrainingRecord> findByAnnouncementId(Long announcementId);

    long countByAnnouncementId(Long announcementId);
}
