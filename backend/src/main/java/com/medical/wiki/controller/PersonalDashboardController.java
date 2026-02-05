package com.medical.wiki.controller;

import com.medical.wiki.dto.PersonalDashboardDto;
import com.medical.wiki.entity.PaidLeave;
import com.medical.wiki.entity.Progress;
import com.medical.wiki.repository.PaidLeaveRepository;
import com.medical.wiki.repository.ProgressRepository;
import com.medical.wiki.repository.ManualRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PersonalDashboardController {

    private final ProgressRepository progressRepository;
    private final PaidLeaveRepository paidLeaveRepository;
    private final ManualRepository manualRepository;

    @GetMapping("/my/dashboard")
    public PersonalDashboardDto getDashboard(@RequestHeader(value = "X-User-Id") Long userId) {
        List<Progress> progressList = progressRepository.findByUserIdOrderByReadAtDesc(userId);
        long totalManuals = manualRepository.count();

        // Calculate monthly read count
        LocalDate now = LocalDate.now();
        int monthlyCount = (int) progressList.stream()
                .filter(p -> {
                    LocalDate readDate = p.getReadAt().toLocalDate();
                    return readDate.getMonth() == now.getMonth() && readDate.getYear() == now.getYear();
                })
                .count();

        String lastReadDate = progressList.isEmpty() ? "-"
                : progressList.get(0).getReadAt().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));

        int pendingLeaves = (int) paidLeaveRepository.countByUserIdAndStatus(userId, PaidLeave.Status.PENDING);
        int approvedLeaves = (int) paidLeaveRepository.countByUserIdAndStatus(userId, PaidLeave.Status.APPROVED);

        return PersonalDashboardDto.builder()
                .completedManualsCount(progressList.size())
                .totalManualsCount((int) totalManuals)
                .monthlyReadCount(monthlyCount)
                .lastReadDate(lastReadDate)
                .pendingLeaveRequestsCount(pendingLeaves)
                .approvedLeaveRequestsCount(approvedLeaves)
                .unreadNotificationsCount(0) // Mock
                .build();
    }
}
