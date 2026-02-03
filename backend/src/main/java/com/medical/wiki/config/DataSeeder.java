package com.medical.wiki.config;

import com.medical.wiki.entity.Department;
import com.medical.wiki.entity.Facility;
import com.medical.wiki.repository.DepartmentRepository;
import com.medical.wiki.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Seeds initial facility and department data on application startup.
 * Uses ON CONFLICT-like logic to avoid duplicates.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final FacilityRepository facilityRepository;
    private final DepartmentRepository departmentRepository;

    // Master data: facility -> departments
    private static final Map<String, String[]> FACILITY_DEPARTMENTS = Map.of(
            "本館", new String[] { "3階病棟", "4階病棟", "リハビリテーション", "事務部", "栄養課" },
            "南棟", new String[] { "2階病棟", "3階病棟", "透析室" },
            "ひまわりの里病院", new String[] { "外来", "薬局", "検査室" },
            "あおぞら中央クリニック", new String[] { "診療外来", "訪問看護" });

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting data seeding...");

        for (var entry : FACILITY_DEPARTMENTS.entrySet()) {
            String facilityName = entry.getKey();
            String[] departments = entry.getValue();

            // Find or create facility
            Facility facility = facilityRepository.findByNameAndDeletedAtIsNull(facilityName)
                    .orElseGet(() -> {
                        log.info("Creating facility: {}", facilityName);
                        return facilityRepository.save(Facility.builder().name(facilityName).build());
                    });

            // Create departments if not exist
            for (String deptName : departments) {
                boolean exists = departmentRepository.existsByNameAndFacilityIdAndDeletedAtIsNull(deptName,
                        facility.getId());
                if (!exists) {
                    log.info("Creating department: {} for facility: {}", deptName, facilityName);
                    departmentRepository.save(Department.builder()
                            .name(deptName)
                            .facility(facility)
                            .build());
                }
            }
        }

        log.info("Data seeding completed.");
    }
}
