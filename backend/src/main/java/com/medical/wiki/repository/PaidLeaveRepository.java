package com.medical.wiki.repository;

import com.medical.wiki.entity.PaidLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaidLeaveRepository extends JpaRepository<PaidLeave, Long> {
    List<PaidLeave> findByUserIdOrderByDateDesc(Long userId);

    List<PaidLeave> findAllByOrderByDateDesc();
}
