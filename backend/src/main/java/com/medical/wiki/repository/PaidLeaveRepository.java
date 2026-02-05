package com.medical.wiki.repository;

import com.medical.wiki.entity.PaidLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaidLeaveRepository extends JpaRepository<PaidLeave, Long> {
    List<PaidLeave> findByUserIdOrderByStartDateDesc(Long userId);

    List<PaidLeave> findAllByOrderByStartDateDesc();

    long countByUserIdAndStatus(Long userId, PaidLeave.Status status);
}
