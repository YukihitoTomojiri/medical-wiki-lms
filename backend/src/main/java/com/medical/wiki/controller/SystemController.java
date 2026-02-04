package com.medical.wiki.controller;

import com.medical.wiki.dto.UserDto;
import com.medical.wiki.repository.SystemLogRepository;
import com.medical.wiki.service.ComplianceExportService;
import com.medical.wiki.service.ProgressService;
import com.medical.wiki.service.UserService;
import com.medical.wiki.service.LoggingService;
import com.medical.wiki.service.SystemStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class SystemController {

    private final SystemLogRepository logRepository;
    private final UserService userService;
    private final ProgressService progressService;
    private final LoggingService loggingService;
    private final ComplianceExportService complianceExportService;
    private final SystemStatusService systemStatusService;

    @GetMapping("/system")
    public ResponseEntity<?> getSystemStats() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "database", "Connected",
                "version", "1.1.0"));
    }

    @GetMapping("/system/diagnostics")
    public ResponseEntity<?> getDiagnostics() {
        long uptime = ManagementFactory.getRuntimeMXBean().getUptime();
        Map<String, Object> data = systemStatusService.getResourceMetrics();
        data.put("uptime", uptime);
        data.put("dbPing", 5); // Mocked latency in ms for now

        return ResponseEntity.ok(data);
    }

    @GetMapping("/system/resources")
    public ResponseEntity<?> getResources() {
        return ResponseEntity.ok(systemStatusService.getResourceMetrics());
    }

    @GetMapping("/logs")
    public ResponseEntity<?> getLogs() {
        return ResponseEntity.ok(logRepository.findTop100ByOrderByTimestampDesc());
    }

    // ============ Compliance Export APIs ============

    @GetMapping("/compliance/facilities")
    public ResponseEntity<?> getDistinctFacilities() {
        List<String> facilities = complianceExportService.getDistinctFacilities();
        return ResponseEntity.ok(facilities);
    }

    @GetMapping("/compliance/export/csv")
    public ResponseEntity<byte[]> exportProgressCsv(
            @RequestParam(required = false) String facility,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        byte[] csvData = complianceExportService.exportProgressCsv(facility, start, end);

        String filename = String.format("compliance_report_%s.csv",
                LocalDate.now().toString());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(csvData.length))
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }

    // ============ User Management APIs ============

    @PostMapping("/users/bulk-delete")
    public ResponseEntity<?> bulkDelete(@RequestBody List<Long> ids,
            @RequestHeader(value = "X-User-Id", required = false) Long executorId) {
        String executorName = "ADMIN";
        if (executorId != null) {
            executorName = userService.getUserById(executorId).map(UserDto::getName).orElse("ADMIN");
        }
        ids.forEach(userService::deleteUser);
        loggingService.log("BULK_DELETE", ids.size() + " users", "Bulk deletion of users", executorName);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/users/bulk-reset-progress")
    public ResponseEntity<?> bulkResetProgress(@RequestBody List<Long> ids,
            @RequestHeader(value = "X-User-Id", required = false) Long executorId) {
        String executorName = "ADMIN";
        if (executorId != null) {
            executorName = userService.getUserById(executorId).map(UserDto::getName).orElse("ADMIN");
        }
        ids.forEach(progressService::resetProgress);
        loggingService.log("BULK_RESET_PROGRESS", ids.size() + " users", "Bulk progress reset", executorName);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/users/register")
    public ResponseEntity<?> registerUser(@RequestBody com.medical.wiki.dto.UserCreateDto dto,
            @RequestHeader(value = "X-User-Id", required = false) Long executorId) {
        try {
            UserDto created = userService.registerUser(dto, executorId);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/users/bulk-register")
    public ResponseEntity<?> bulkRegister(@RequestBody List<com.medical.wiki.dto.UserCreateDto> dtos,
            @RequestHeader(value = "X-User-Id", required = false) Long executorId) {
        try {
            // Backward compatibility: passing null for restoreIds
            userService.bulkRegisterUsers(dtos, executorId, null);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/users/bulk-register-v2")
    public ResponseEntity<?> bulkRegisterV2(@RequestBody BulkRegisterRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long executorId) {
        try {
            userService.bulkRegisterUsers(request.users, executorId, request.restoreIds);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/users/validate-csv")
    public ResponseEntity<?> validateCsv(@RequestBody List<com.medical.wiki.dto.UserCreateDto> dtos) {
        try {
            return ResponseEntity.ok(userService.validateBulkCsv(dtos));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    public static class BulkRegisterRequest {
        public List<com.medical.wiki.dto.UserCreateDto> users;
        public List<String> restoreIds;
    }
}
