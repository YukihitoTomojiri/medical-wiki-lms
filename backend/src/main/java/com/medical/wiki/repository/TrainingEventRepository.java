package com.medical.wiki.repository;

import com.medical.wiki.entity.TrainingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public interface TrainingEventRepository extends JpaRepository<TrainingEvent, Long> {

        List<TrainingEvent> findAllByStartTimeAfterOrderByStartTimeAsc(LocalDateTime startTime);

        List<TrainingEvent> findByDeletedAtIsNullOrderByCreatedAtDesc();

        List<TrainingEvent> findByFacilityIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long facilityId);

        @Query("SELECT e FROM TrainingEvent e WHERE e.deletedAt IS NULL " +
                        "AND e.startTime >= :now " +
                        "AND (e.isAllFacilities = true OR (:facilityId IS NOT NULL AND e.facilityId = :facilityId)) " +
                        "AND (" +
                        "  (e.targetCommitteeId IS NULL AND (e.targetJobType IS NULL OR e.targetJobType = '')) " +
                        "  OR (e.targetCommitteeId IN :committeeIds) " +
                        "  OR (:jobType IS NOT NULL AND e.targetJobType = :jobType) " +
                        ") " +
                        "ORDER BY e.startTime ASC")
        List<TrainingEvent> findVisibleEvents(
                        @Param("facilityId") Long facilityId,
                        @Param("committeeIds") Set<Long> committeeIds,
                        @Param("jobType") String jobType,
                        @Param("now") LocalDateTime now);
}
