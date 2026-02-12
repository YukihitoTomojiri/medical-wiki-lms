package com.medical.wiki.repository;

import com.medical.wiki.entity.TrainingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public interface TrainingEventRepository extends JpaRepository<TrainingEvent, Long> {

        @Query("SELECT e FROM TrainingEvent e WHERE " +
                        "(e.targetCommitteeId IS NULL OR e.targetCommitteeId IN :committeeIds) AND " +
                        "(e.targetJobType IS NULL OR e.targetJobType = :jobType) AND " +
                        "e.deletedAt IS NULL AND " +
                        ":now BETWEEN e.startTime AND e.endTime " +
                        "ORDER BY e.startTime DESC")
        List<TrainingEvent> findVisibleEvents(
                        @Param("committeeIds") Set<Long> committeeIds,
                        @Param("jobType") String jobType,
                        @Param("now") LocalDateTime now);

        // For Admin: Facility-specific events
        List<TrainingEvent> findByFacilityIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long facilityId);

        // For Developer: All non-deleted events
        List<TrainingEvent> findByDeletedAtIsNullOrderByCreatedAtDesc();
}
