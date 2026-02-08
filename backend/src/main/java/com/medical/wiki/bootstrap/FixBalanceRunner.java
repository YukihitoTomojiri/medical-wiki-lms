package com.medical.wiki.bootstrap;

import com.medical.wiki.service.PaidLeaveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class FixBalanceRunner implements CommandLineRunner {

    private final PaidLeaveService paidLeaveService;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting one-time paid leave balance consistency fix...");
        try {
            paidLeaveService.fixBalanceConsistency();
            log.info("Paid leave balance consistency fix completed successfully.");
        } catch (Exception e) {
            log.error("Failed to fix paid leave balance consistency", e);
        }
    }
}
