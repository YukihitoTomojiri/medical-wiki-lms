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

    private final com.medical.wiki.repository.UserRepository userRepository;
    private final ProgressRepository progressRepository;
    private final ManualRepository manualRepository;
    private final PaidLeaveRepository paidLeaveRepository;
    private final com.medical.wiki.repository.AttendanceRequestRepository attendanceRequestRepository;

    @GetMapping("/my/summary")
    public PersonalDashboardDto getDashboard(@RequestHeader(value = "X-User-Id") Long userId) {
        List<Progress> progressList = progressRepository.findByUserIdOrderByReadAtDesc(userId);
        long totalManuals = manualRepository.count();

        com.medical.wiki.entity.User user = userRepository.findById(userId).orElseThrow();

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

        int pendingPaidLeaves = (int) paidLeaveRepository.countByUserIdAndStatus(userId, PaidLeave.Status.PENDING);
        int approvedPaidLeaves = (int) paidLeaveRepository.countByUserIdAndStatus(userId, PaidLeave.Status.APPROVED);

        int pendingAttRequests = (int) attendanceRequestRepository.countByUserIdAndStatus(userId,
                com.medical.wiki.entity.AttendanceRequest.Status.PENDING);
        int approvedAttRequests = (int) attendanceRequestRepository.countByUserIdAndStatus(userId,
                com.medical.wiki.entity.AttendanceRequest.Status.APPROVED);

        int pendingLeaves = pendingPaidLeaves + pendingAttRequests;
        int approvedLeaves = approvedPaidLeaves + approvedAttRequests;

        return PersonalDashboardDto.builder()
                .completedManualsCount(progressList.size())
                .totalManualsCount((int) totalManuals)
                .monthlyReadCount(monthlyCount)
                .lastReadDate(lastReadDate)
                .pendingLeaveRequestsCount(pendingLeaves)
                .approvedLeaveRequestsCount(approvedLeaves)
                .paidLeaveDays(user.getPaidLeaveDays() != null ? user.getPaidLeaveDays() : 0.0)
                .unreadNotificationsCount(0) // Mock
                .build();
    }
}
