package com.medical.wiki.controller;

import com.medical.wiki.dto.PaidLeaveDto;
import com.medical.wiki.entity.PaidLeave;
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
        return service.submitRequest(userId, request.getStartDate(), request.getEndDate(), request.getReason());
    }

    @GetMapping("/leaves/history")
    public List<PaidLeaveDto> getMyRequests(@RequestHeader(value = "X-User-Id") Long userId) {
        return service.getMyRequests(userId);
    }

    @GetMapping("/admin/paid-leaves")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public List<PaidLeaveDto> getAllRequests() {
        return service.getAllRequests();
    }

    @PutMapping("/admin/paid-leaves/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public PaidLeaveDto approveRequest(@PathVariable Long id) {
        return service.updateStatus(id, PaidLeave.Status.APPROVED, null);
    }

    @PutMapping("/admin/paid-leaves/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public PaidLeaveDto rejectRequest(@PathVariable Long id, @RequestBody(required = false) RejectionRequest request) {
        String reason = request != null ? request.getReason() : null;
        return service.updateStatus(id, PaidLeave.Status.REJECTED, reason);
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
    }
}
