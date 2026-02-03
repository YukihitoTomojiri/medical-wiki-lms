package com.medical.wiki.repository;

import com.medical.wiki.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByDeletedAtIsNullOrderByNameAsc();

    List<Department> findByFacilityIdAndDeletedAtIsNullOrderByNameAsc(Long facilityId);

    Optional<Department> findByIdAndDeletedAtIsNull(Long id);

    boolean existsByNameAndFacilityIdAndDeletedAtIsNull(String name, Long facilityId);
}
