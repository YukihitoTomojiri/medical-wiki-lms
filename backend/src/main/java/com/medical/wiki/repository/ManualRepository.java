package com.medical.wiki.repository;

import com.medical.wiki.entity.Manual;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ManualRepository extends JpaRepository<Manual, Long> {
    List<Manual> findByCategoryAndDeletedAtIsNull(String category);

    List<Manual> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    long countByDeletedAtIsNull();
}
