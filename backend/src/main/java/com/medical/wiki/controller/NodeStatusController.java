package com.medical.wiki.controller;

import com.medical.wiki.dto.NodeStatusDto;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Controller for node status monitoring.
 * Integrates with Spring Boot Actuator for health checks.
 */
@RestController
@RequestMapping("/api/nodes")
@RequiredArgsConstructor
@Slf4j
public class NodeStatusController {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    // Simulated last activity timestamps (in production, this would come from
    // session/activity tracking)
    private static final Map<Long, Long> lastActivityMap = new HashMap<>();
    private static final Random random = new Random();

    // Health thresholds
    private static final double MEMORY_WARNING_THRESHOLD = 80.0; // Warn if memory usage > 80%
    private static final long DB_PING_WARNING_THRESHOLD = 500; // Warn if DB ping > 500ms

    /**
     * Get health status of all nodes (users).
     * Combines system health with real DB/memory metrics.
     */
    @GetMapping("/status")
    public ResponseEntity<List<NodeStatusDto>> getAllNodeStatus() {
        List<User> users = userRepository.findAllByDeletedAtIsNull();

        // Get real system health metrics
        NodeStatusDto.HealthMetrics systemMetrics = getSystemHealthMetrics();
        // Use DB connection as a proxy for system health
        boolean systemUp = Boolean.TRUE.equals(systemMetrics.getDbConnected());

        List<NodeStatusDto> nodeStatuses = users.stream()
                .map(user -> buildNodeStatus(user, systemUp, systemMetrics))
                .toList();

        return ResponseEntity.ok(nodeStatuses);
    }

    /**
     * Get single node status by user ID.
     */
    @GetMapping("/status/{userId}")
    public ResponseEntity<NodeStatusDto> getNodeStatus(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .map(user -> {
                    NodeStatusDto.HealthMetrics systemMetrics = getSystemHealthMetrics();
                    boolean systemUp = Boolean.TRUE.equals(systemMetrics.getDbConnected());
                    return ResponseEntity.ok(buildNodeStatus(user, systemUp, systemMetrics));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Simulate status change for a node (for demo/testing purposes).
     */
    @PostMapping("/status/{userId}/simulate")
    public ResponseEntity<Map<String, Object>> simulateStatusChange(
            @PathVariable Long userId,
            @RequestParam String status) {
        if ("UP".equals(status)) {
            lastActivityMap.put(userId, System.currentTimeMillis());
        } else if ("DOWN".equals(status)) {
            lastActivityMap.put(userId, System.currentTimeMillis() - 90000000L);
        } else {
            lastActivityMap.put(userId, System.currentTimeMillis() - 43200000L);
        }
        return ResponseEntity.ok(Map.of("success", true, "userId", userId, "newStatus", status));
    }

    /**
     * Get real system health metrics (memory and DB).
     */
    private NodeStatusDto.HealthMetrics getSystemHealthMetrics() {
        Runtime runtime = Runtime.getRuntime();
        long usedMemory = runtime.totalMemory() - runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        double memoryUsagePercent = (double) usedMemory / maxMemory * 100;

        // DB ping check
        long dbPingMs = -1;
        boolean dbConnected = false;
        try {
            long start = System.currentTimeMillis();
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            dbPingMs = System.currentTimeMillis() - start;
            dbConnected = true;
        } catch (Exception e) {
            log.warn("DB health check failed: {}", e.getMessage());
        }

        String warningReason = null;
        if (!dbConnected) {
            warningReason = "データベース接続エラー";
        } else if (dbPingMs > DB_PING_WARNING_THRESHOLD) {
            warningReason = "データベース応答遅延";
        } else if (memoryUsagePercent > MEMORY_WARNING_THRESHOLD) {
            warningReason = "リソース不足（メモリ使用率: " + String.format("%.1f", memoryUsagePercent) + "%)";
        }

        return NodeStatusDto.HealthMetrics.builder()
                .memoryUsagePercent(memoryUsagePercent)
                .dbPingMs(dbPingMs)
                .dbConnected(dbConnected)
                .warningReason(warningReason)
                .build();
    }

    /**
     * Build NodeStatusDto for a user with health metrics.
     */
    private NodeStatusDto buildNodeStatus(User user, boolean systemUp, NodeStatusDto.HealthMetrics metrics) {
        String status;
        String statusDetail;
        String statusLabel;

        // Determine status based on system health and user activity
        if (!systemUp || !Boolean.TRUE.equals(metrics.getDbConnected())) {
            status = "DOWN";
            statusLabel = "停止中";
            statusDetail = "通信途絶 (System Down)";
        } else if (metrics.getWarningReason() != null) {
            status = "WARNING";
            statusLabel = "警告あり";
            statusDetail = metrics.getWarningReason();
        } else {
            // Calculate based on last activity (lastSeenAt)
            LocalDateTime lastSeen = user.getLastSeenAt();

            if (lastSeen == null) {
                // Never seen
                status = "DOWN";
                statusLabel = "停止中";
                statusDetail = "未接続";
            } else {
                LocalDateTime now = LocalDateTime.now();
                if (lastSeen.isAfter(now.minusMinutes(10))) {
                    // Active within 10 mins
                    status = "UP";
                    statusLabel = "稼働中";
                    statusDetail = "オンライン";
                } else if (lastSeen.isBefore(now.minusDays(14))) {
                    // Inactive for > 14 days
                    status = "WARNING";
                    statusLabel = "長期未接続";
                    statusDetail = "14日以上未接続";
                } else {
                    // In between
                    status = "DOWN"; // Or gray
                    statusLabel = "離席中";
                    statusDetail = "オフライン";
                }
            }
        }

        boolean isAlert = "WARNING".equals(status)
                || "DOWN".equals(status) && "通信途絶 (System Down)".equals(statusDetail);

        return NodeStatusDto.builder()
                .userId(user.getId())
                .name(user.getName())
                .facility(user.getFacility())
                .department(user.getDepartment())
                .status(status)
                .statusLabel(statusLabel)
                .statusDetail(statusDetail)
                // Convert LocalDateTime lastSeenAt to timestamp for frontend compatibility if
                // needed, using simulated map as fallback if entity field null for demo
                .lastActivity(user.getLastSeenAt() != null ? java.sql.Timestamp.valueOf(user.getLastSeenAt()).getTime()
                        : null)
                .isAlert(isAlert)
                .healthMetrics(metrics)
                .build();
    }

    private String getStatusLabel(String status) {
        return switch (status) {
            case "UP" -> "稼働中";
            case "DOWN" -> "停止中";
            case "WARNING" -> "警告あり";
            default -> "不明";
        };
    }
}
