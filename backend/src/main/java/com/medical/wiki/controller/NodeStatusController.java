package com.medical.wiki.controller;

import com.medical.wiki.dto.NodeStatusDto;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.health.Status;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

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
    private final HealthEndpoint healthEndpoint;
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
     * Combines actuator health with real DB/memory metrics.
     */
    @GetMapping("/status")
    public ResponseEntity<List<NodeStatusDto>> getAllNodeStatus() {
        List<User> users = userRepository.findAllByDeletedAtIsNull();

        // Get real system health metrics
        NodeStatusDto.HealthMetrics systemMetrics = getSystemHealthMetrics();
        Status systemHealth = healthEndpoint.health().getStatus();
        boolean systemUp = systemHealth.equals(Status.UP);

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
                    Status systemHealth = healthEndpoint.health().getStatus();
                    boolean systemUp = systemHealth.equals(Status.UP);
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
        if (!lastActivityMap.containsKey(user.getId())) {
            lastActivityMap.put(user.getId(), System.currentTimeMillis() - random.nextInt(86400000));
        }

        String status;
        String statusDetail;

        // Determine status based on system health and user activity
        if (!systemUp || !metrics.getDbConnected()) {
            status = "DOWN";
            statusDetail = "通信途絶";
        } else if (metrics.getWarningReason() != null) {
            status = "WARNING";
            statusDetail = metrics.getWarningReason();
        } else {
            // Calculate based on last activity
            Long lastActivity = lastActivityMap.get(user.getId());
            if (lastActivity == null) {
                int rand = random.nextInt(100);
                if (rand < 70) {
                    status = "UP";
                    statusDetail = "正常稼働";
                } else if (rand < 90) {
                    status = "WARNING";
                    statusDetail = "応答遅延";
                } else {
                    status = "DOWN";
                    statusDetail = "通信途絶";
                }
            } else {
                long hoursSinceActivity = (System.currentTimeMillis() - lastActivity) / 3600000;
                if (hoursSinceActivity < 1) {
                    status = "UP";
                    statusDetail = "正常稼働";
                } else if (hoursSinceActivity < 24) {
                    status = "WARNING";
                    statusDetail = "長時間未接続";
                } else {
                    status = "DOWN";
                    statusDetail = "通信途絶";
                }
            }
        }

        boolean isAlert = !"UP".equals(status);

        return NodeStatusDto.builder()
                .userId(user.getId())
                .name(user.getName())
                .facility(user.getFacility())
                .department(user.getDepartment())
                .status(status)
                .statusLabel(getStatusLabel(status))
                .statusDetail(statusDetail)
                .lastActivity(lastActivityMap.get(user.getId()))
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
