package com.medical.wiki.controller;

import com.medical.wiki.dto.AttendanceRequestDto;
import com.medical.wiki.entity.AttendanceRequest;
import com.medical.wiki.service.AttendanceRequestService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AttendanceRequestController {

    private final AttendanceRequestService service;

    @PostMapping("/attendance/requests")
    public AttendanceRequestDto submitRequest(
            @RequestHeader(value = "X-User-Id") Long userId,
            @RequestBody RequestForm request) {
        return service.submitRequest(userId, request.getType(), request.getDurationType(), request.getStartDate(),
                request.getEndDate(), request.getStartTime(), request.getEndTime(), request.getReason());
    }

    @GetMapping("/attendance/requests/my")
    public List<AttendanceRequestDto> getMyRequests(@RequestHeader(value = "X-User-Id") Long userId) {
        return service.getMyRequests(userId);
    }

    @GetMapping("/admin/attendance/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public List<AttendanceRequestDto> getAllRequests(@RequestHeader(value = "X-User-Id") Long userId) {
        return service.getAllRequests(userId);
    }

    @PutMapping("/admin/attendance/requests/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public AttendanceRequestDto approveRequest(@PathVariable Long id) {
        return service.updateStatus(id, AttendanceRequest.Status.APPROVED, null);
    }

    @PutMapping("/admin/attendance/requests/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEVELOPER')")
    public AttendanceRequestDto rejectRequest(@PathVariable Long id,
            @RequestBody(required = false) RejectionRequest request) {
        String reason = request != null ? request.getReason() : null;
        return service.updateStatus(id, AttendanceRequest.Status.REJECTED, reason);
    }

    @Data
    public static class RejectionRequest {
        private String reason;
    }

    @Data
    public static class RequestForm {
        private AttendanceRequest.RequestType type;
        private AttendanceRequest.DurationType durationType;
        private LocalDate startDate;
        private LocalDate endDate;
        private LocalTime startTime;
        private LocalTime endTime;
        private String reason;
    }
}
