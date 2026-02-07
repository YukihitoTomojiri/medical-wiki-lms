package com.medical.wiki.repository;

import com.medical.wiki.entity.UserFacilityMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserFacilityMappingRepository extends JpaRepository<UserFacilityMapping, Long> {
    List<UserFacilityMapping> findByUserIdAndDeletedAtIsNull(Long userId);

    List<UserFacilityMapping> findByFacilityNameAndDeletedAtIsNull(String facilityName);

    boolean existsByUserIdAndFacilityNameAndDeletedAtIsNull(Long userId, String facilityName);
}
