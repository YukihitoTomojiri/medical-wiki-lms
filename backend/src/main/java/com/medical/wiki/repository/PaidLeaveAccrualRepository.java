package com.medical.wiki.repository;

import com.medical.wiki.entity.PaidLeaveAccrual;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaidLeaveAccrualRepository extends JpaRepository<PaidLeaveAccrual, Long> {
    List<PaidLeaveAccrual> findByUserIdAndDeletedAtIsNullOrderByGrantedAtDesc(Long userId);
}
