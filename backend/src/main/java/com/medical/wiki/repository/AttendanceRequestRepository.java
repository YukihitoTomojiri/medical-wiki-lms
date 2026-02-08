package com.medical.wiki.repository;

import com.medical.wiki.entity.AttendanceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRequestRepository extends JpaRepository<AttendanceRequest, Long> {
    List<AttendanceRequest> findByUserIdOrderByStartDateDesc(Long userId);

    List<AttendanceRequest> findAllByOrderByStartDateDesc();

    long countByUserIdAndStatus(Long userId, AttendanceRequest.Status status);

    List<AttendanceRequest> findByUser_FacilityInAndDeletedAtIsNullOrderByStartDateDesc(List<String> facilities);

    List<AttendanceRequest> findByDeletedAtIsNullOrderByStartDateDesc();

    @Query("SELECT COUNT(a) > 0 FROM AttendanceRequest a WHERE a.user.id = :userId " +
            "AND a.startDate = :date AND a.type = :type " +
            "AND a.status IN (com.medical.wiki.entity.AttendanceRequest.Status.PENDING, com.medical.wiki.entity.AttendanceRequest.Status.APPROVED) "
            +
            "AND a.deletedAt IS NULL")
    boolean existsDuplicate(@Param("userId") Long userId,
            @Param("date") LocalDate date,
            @Param("type") AttendanceRequest.RequestType type);
}
