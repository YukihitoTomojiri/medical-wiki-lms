package com.medical.wiki.controller;

import com.medical.wiki.dto.AuditLogDto;
import com.medical.wiki.dto.UserDto;
import com.medical.wiki.entity.Manual;
import com.medical.wiki.repository.ManualRepository;
import com.medical.wiki.repository.ProgressRepository;
import com.medical.wiki.repository.SystemLogRepository;
import com.medical.wiki.repository.UserRepository;
import com.medical.wiki.service.ComplianceExportService;
import com.medical.wiki.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final SystemLogRepository logRepository;
    private final UserService userService;
    private final ManualRepository manualRepository;
    private final ProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final ComplianceExportService exportService;

    @GetMapping("/audit-logs")
    public List<AuditLogDto> getAuditLogs() {
        return logRepository.findAllByOrderByTimestampDesc().stream()
                .map(AuditLogDto::fromEntity)
                .collect(Collectors.toList());
    }

    @PostMapping("/users/{id}/restore")
    public UserDto restoreUser(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long executorId) {
        userService.restoreUser(id, executorId);
        return userService.getUserById(id).orElseThrow(() -> new RuntimeException("User not found after restore"));
    }

    @GetMapping("/users/all-including-deleted")
    public List<UserDto> getAllUsersIncludingDeleted(@RequestParam(required = false) String facility) {
        return userService.getAllUsersIncludingDeleted(facility);
    }

    @PostMapping("/notifications/remind/{userId}")
    public ResponseEntity<Void> remindUser(@PathVariable Long userId) {
        // Send email/notification logic here
        // For now we just return success as "mock" for the requirement
        return ResponseEntity.ok().build();
    }

    @GetMapping("/manuals/lagging")
    public List<Map<String, Object>> getLaggingManuals() {
        long totalUsers = userRepository.countByDeletedAtIsNull();
        List<Manual> manuals = manualRepository.findAll();
        List<Object[]> stats = progressRepository.countCompletionsPerManual();

        Map<Long, Long> completionCounts = stats.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]));

        return manuals.stream()
                .map(m -> {
                    long count = completionCounts.getOrDefault(m.getId(), 0L);
                    double rate = totalUsers > 0 ? (double) count / totalUsers * 100 : 0;
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", m.getId());
                    map.put("title", m.getTitle());
                    map.put("completionRate", Math.round(rate * 10.0) / 10.0);
                    map.put("uncompletedCount", totalUsers - count);
                    return map;
                })
                .sorted((a, b) -> Double.compare((Double) a.get("completionRate"), (Double) b.get("completionRate")))
                .limit(3)
                .collect(Collectors.toList());
    }

    @GetMapping("/export/compliance")
    public ResponseEntity<byte[]> exportComplianceCsv(
            @RequestParam(required = false) String facility,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        LocalDate start = startDate != null && !startDate.isEmpty() ? LocalDate.parse(startDate) : null;
        LocalDate end = endDate != null && !endDate.isEmpty() ? LocalDate.parse(endDate) : null;

        byte[] csvData = exportService.exportProgressCsv(facility, start, end);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=compliance_report.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
