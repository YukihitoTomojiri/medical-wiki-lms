package com.medical.wiki.controller;

import com.medical.wiki.dto.PaidLeaveDto;
import com.medical.wiki.entity.PaidLeave;
import com.medical.wiki.entity.PaidLeaveAccrual;
import com.medical.wiki.service.PaidLeaveService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaidLeaveController {

    private final PaidLeaveService service;

    @PostMapping("/leaves/apply")
    public PaidLeaveDto submitRequest(
            @RequestHeader(value = "X-User-Id") Long userId,
            @RequestBody PaidLeaveRequest request) {
        PaidLeave.LeaveType leaveType = PaidLeave.LeaveType.FULL;
        if (request.getLeaveType() != null) {
            try {
                leaveType = PaidLeave.LeaveType.valueOf(request.getLeaveType().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Default to FULL if invalid
            }
        }
        return service.submitRequest(userId, request.getStartDate(), request.getEndDate(), request.getReason(),
                leaveType);
    }

    @PostMapping("/leaves/apply-bulk")
    public List<PaidLeaveDto> submitBulkRequests(
            @RequestHeader(value = "X-User-Id") Long userId,
            @RequestBody List<PaidLeaveRequest> requests) {
        return service.submitBulkRequests(userId, requests);
    }

    @GetMapping("/leaves/history")
    public List<PaidLeaveDto> getMyRequests(@RequestHeader(value = "X-User-Id") Long userId) {
        return service.getMyRequests(userId);
    }

    @GetMapping("/admin/paid-leaves")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public List<PaidLeaveDto> getAllRequests(@RequestHeader(value = "X-User-Id") Long userId) {
        return service.getAllRequests(userId);
    }

    @PutMapping("/admin/paid-leaves/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public PaidLeaveDto approveRequest(@PathVariable Long id) {
        return service.updateStatus(id, PaidLeave.Status.APPROVED, null);
    }

    @PostMapping("/admin/paid-leaves/bulk-approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public void bulkApprove(@RequestBody List<Long> ids) {
        service.bulkApprove(ids);
    }

    @PutMapping("/admin/paid-leaves/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public PaidLeaveDto rejectRequest(@PathVariable Long id, @RequestBody(required = false) RejectionRequest request) {
        String reason = request != null ? request.getReason() : null;
        return service.updateStatus(id, PaidLeave.Status.REJECTED, reason);
    }

    @PostMapping("/admin/users/{userId}/grant-leave")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public void grantPaidLeave(
            @PathVariable Long userId,
            @RequestHeader(value = "X-User-Id") Long grantedById,
            @RequestBody GrantLeaveRequest request) {
        service.grantPaidLeaveDays(userId, request.getDaysToGrant(), grantedById, request.getReason());
    }

    @GetMapping("/admin/users/{userId}/accrual-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public List<PaidLeaveAccrual> getAccrualHistory(@PathVariable Long userId) {
        return service.getAccrualHistory(userId);
    }

    @PostMapping("/admin/system/fix-balance-consistency")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public void fixBalanceConsistency() {
        service.fixBalanceConsistency();
    }

    @Data
    public static class RejectionRequest {
        private String reason;
    }

    @Data
    public static class PaidLeaveRequest {
        private LocalDate startDate;
        private LocalDate endDate;
        private String reason;
        private String leaveType; // FULL, HALF_AM, HALF_PM
    }

    @Data
    public static class GrantLeaveRequest {
        private Double daysToGrant;
        private String reason;
    }
}
