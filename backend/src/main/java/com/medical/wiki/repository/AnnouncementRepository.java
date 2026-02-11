package com.medical.wiki.repository;

import com.medical.wiki.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    @Query("SELECT a FROM Announcement a LEFT JOIN FETCH a.createdBy WHERE " +
            "(a.facilityId IS NULL OR a.facilityId = :facilityId) AND " +
            "a.deletedAt IS NULL AND " +
            "a.displayUntil >= :today " +
            "ORDER BY CASE a.priority WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 WHEN 'LOW' THEN 3 END ASC, a.createdAt DESC")
    List<Announcement> findActiveAnnouncements(@Param("facilityId") Long facilityId, @Param("today") LocalDate today);

    // For Admin Management (No date filter, logic deleted excluded)
    // Admin sees only their facility's announcements (or global if they are
    // developer/superadmin - handled in service calling different methods)
    List<Announcement> findByFacilityIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long facilityId);

    // For Developer (Global announcements)
    List<Announcement> findByFacilityIdIsNullAndDeletedAtIsNullOrderByCreatedAtDesc();
}
