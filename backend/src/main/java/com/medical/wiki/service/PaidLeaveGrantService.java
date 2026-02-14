package com.medical.wiki.service;

import com.medical.wiki.entity.User;
import com.medical.wiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaidLeaveGrantService {

    private final UserRepository userRepository;
    private final PaidLeaveCalculationService calculationService;

    /**
     * Run every day at 01:00 AM to grant paid leave.
     */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void grantPaidLeaveAutomatically() {
        log.info("Starting automatic paid leave grant process...");
        LocalDate today = LocalDate.now();
        List<User> users = userRepository.findAll(); // In a real app, maybe filter by deletedAt is null

        for (User user : users) {
            if (user.getDeletedAt() != null)
                continue;

            if (calculationService.isGrantDay(user.getHiredAt(), today)) {
                int monthsWorked = calculationService.calculateMonthsWorked(user.getHiredAt(), today);
                double grantDays = calculationService.calculateGrantDays(monthsWorked);

                if (grantDays > 0) {
                    log.info("Granting {} days to user {} (ID: {}). Months worked: {}",
                            grantDays, user.getName(), user.getId(), monthsWorked);

                    user.setPaidLeaveDays(user.getPaidLeaveDays() + grantDays);
                    userRepository.save(user);

                    // Note: In a real app, we should also record this in paid_leave_accruals table
                    // but for this MVP/Task, updating the user's balance is the primary goal.
                    // If paidLeaveAccrualRepository was available, we'd use it here.
                }
            }
        }
        log.info("Automatic paid leave grant process finished.");
    }
}
