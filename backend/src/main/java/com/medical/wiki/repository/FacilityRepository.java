package com.medical.wiki.repository;

import com.medical.wiki.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FacilityRepository extends JpaRepository<Facility, Long> {
    List<Facility> findByDeletedAtIsNullOrderByNameAsc();

    Optional<Facility> findByIdAndDeletedAtIsNull(Long id);

    Optional<Facility> findByNameAndDeletedAtIsNull(String name);

    boolean existsByNameAndDeletedAtIsNull(String name);
}
