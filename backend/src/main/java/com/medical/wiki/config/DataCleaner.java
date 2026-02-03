package com.medical.wiki.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cleans up duplicate data on application startup.
 * Runs before DataSeeder (Order 0 vs Order 1).
 */
@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class DataCleaner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting data cleanup...");

        // Delete duplicate departments (keep the one with minimum ID)
        String deleteDuplicateDepts = """
                    DELETE d1 FROM departments d1
                    INNER JOIN departments d2
                    ON d1.facility_id = d2.facility_id
                       AND d1.name = d2.name
                       AND d1.id > d2.id
                       AND d1.deleted_at IS NULL
                       AND d2.deleted_at IS NULL
                """;

        try {
            int deletedDepts = jdbcTemplate.update(deleteDuplicateDepts);
            if (deletedDepts > 0) {
                log.info("Deleted {} duplicate department records", deletedDepts);
            }
        } catch (Exception e) {
            log.warn("Could not delete duplicate departments: {}", e.getMessage());
        }

        // Delete duplicate facilities (keep the one with minimum ID)
        String deleteDuplicateFacs = """
                    DELETE f1 FROM facilities f1
                    INNER JOIN facilities f2
                    ON f1.name = f2.name
                       AND f1.id > f2.id
                       AND f1.deleted_at IS NULL
                       AND f2.deleted_at IS NULL
                """;

        try {
            int deletedFacs = jdbcTemplate.update(deleteDuplicateFacs);
            if (deletedFacs > 0) {
                log.info("Deleted {} duplicate facility records", deletedFacs);
            }
        } catch (Exception e) {
            log.warn("Could not delete duplicate facilities: {}", e.getMessage());
        }

        log.info("Data cleanup completed.");
    }
}
