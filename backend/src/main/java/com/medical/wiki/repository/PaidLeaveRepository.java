package com.medical.wiki.repository;

import com.medical.wiki.entity.PaidLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface PaidLeaveRepository extends JpaRepository<PaidLeave, Long> {
        List<PaidLeave> findByUserIdOrderByStartDateDesc(Long userId);

        List<PaidLeave> findByUserIdAndStatusOrderByStartDateAsc(Long userId, PaidLeave.Status status);

        List<PaidLeave> findAllByOrderByStartDateDesc();

        long countByUserIdAndStatus(Long userId, PaidLeave.Status status);

        List<PaidLeave> findByUser_FacilityInAndDeletedAtIsNullOrderByStartDateDesc(List<String> facilities);

        List<PaidLeave> findByDeletedAtIsNullOrderByStartDateDesc();

        @Query("SELECT COUNT(p) > 0 FROM PaidLeave p WHERE p.user.id = :userId " +
                        "AND p.status IN :statuses AND p.deletedAt IS NULL " +
                        "AND p.startDate <= :endDate AND p.endDate >= :startDate")
        boolean existsOverlapping(@Param("userId") Long userId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        @Param("statuses") List<PaidLeave.Status> statuses);

        List<PaidLeave> findByUserIdAndStartDateGreaterThanEqualOrderByStartDateDesc(Long userId, LocalDate startDate);
}
