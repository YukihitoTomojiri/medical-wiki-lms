package com.medical.wiki.repository;

import com.medical.wiki.entity.AttendanceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRequestRepository extends JpaRepository<AttendanceRequest, Long> {
    List<AttendanceRequest> findByUserIdOrderByStartDateDesc(Long userId);

    List<AttendanceRequest> findAllByOrderByStartDateDesc();

    long countByUserIdAndStatus(Long userId, AttendanceRequest.Status status);

    List<AttendanceRequest> findByUser_FacilityInAndDeletedAtIsNullOrderByStartDateDesc(List<String> facilities);

    List<AttendanceRequest> findByDeletedAtIsNullOrderByStartDateDesc();
}
