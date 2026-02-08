package com.medical.wiki.repository;

import com.medical.wiki.entity.PaidLeaveAccrual;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaidLeaveAccrualRepository extends JpaRepository<PaidLeaveAccrual, Long> {
    List<PaidLeaveAccrual> findByUserIdAndDeletedAtIsNullOrderByGrantedAtDesc(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(p.daysGranted) FROM PaidLeaveAccrual p WHERE p.user.id = :userId AND p.deletedAt IS NULL")
    Double sumGrantedDays(@org.springframework.data.repository.query.Param("userId") Long userId);
}
