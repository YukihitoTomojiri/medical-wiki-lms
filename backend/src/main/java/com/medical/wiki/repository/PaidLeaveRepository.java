package com.medical.wiki.repository;

import com.medical.wiki.entity.PaidLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaidLeaveRepository extends JpaRepository<PaidLeave, Long> {
    List<PaidLeave> findByUserIdOrderByStartDateDesc(Long userId);

    List<PaidLeave> findAllByOrderByStartDateDesc();

    List<PaidLeave> findByUserIdAndStatus(Long userId, PaidLeave.Status status);

    long countByUserIdAndStatus(Long userId, PaidLeave.Status status);

    List<PaidLeave> findByUserFacilityOrderByStartDateDesc(String facility);

    long countByUserFacilityAndStatus(String facility, PaidLeave.Status status);

    long countByStatus(PaidLeave.Status status);
}
