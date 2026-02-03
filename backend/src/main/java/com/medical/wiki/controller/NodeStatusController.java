package com.medical.wiki.controller;

import com.medical.wiki.dto.NodeStatusDto;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.health.Status;
import org.springframework.http.ResponseEntity;
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
public class NodeStatusController {

    private final UserRepository userRepository;
    private final HealthEndpoint healthEndpoint;

    // Simulated last activity timestamps (in production, this would come from
    // session/activity tracking)
    private static final Map<Long, Long> lastActivityMap = new HashMap<>();
    private static final Random random = new Random();

    /**
     * Get health status of all nodes (users).
     * Combines actuator health with simulated node status.
     */
    @GetMapping("/status")
    public ResponseEntity<List<NodeStatusDto>> getAllNodeStatus() {
        List<User> users = userRepository.findAllByDeletedAtIsNull();

        // Get overall system health from Actuator
        Status systemHealth = healthEndpoint.health().getStatus();
        boolean systemUp = systemHealth.equals(Status.UP);

        List<NodeStatusDto> nodeStatuses = users.stream()
                .map(user -> {
                    // Simulate node status based on various factors
                    String status = calculateNodeStatus(user.getId(), systemUp);
                    String statusLabel = getStatusLabel(status);

                    // Update simulated last activity
                    if (!lastActivityMap.containsKey(user.getId())) {
                        lastActivityMap.put(user.getId(), System.currentTimeMillis() - random.nextInt(86400000)); // within
                                                                                                                  // 24h
                    }

                    return NodeStatusDto.builder()
                            .userId(user.getId())
                            .name(user.getName())
                            .facility(user.getFacility())
                            .department(user.getDepartment())
                            .status(status)
                            .statusLabel(statusLabel)
                            .lastActivity(lastActivityMap.get(user.getId()))
                            .build();
                })
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
                    Status systemHealth = healthEndpoint.health().getStatus();
                    boolean systemUp = systemHealth.equals(Status.UP);

                    String status = calculateNodeStatus(user.getId(), systemUp);
                    String statusLabel = getStatusLabel(status);

                    if (!lastActivityMap.containsKey(user.getId())) {
                        lastActivityMap.put(user.getId(), System.currentTimeMillis() - random.nextInt(86400000));
                    }

                    return ResponseEntity.ok(NodeStatusDto.builder()
                            .userId(user.getId())
                            .name(user.getName())
                            .facility(user.getFacility())
                            .department(user.getDepartment())
                            .status(status)
                            .statusLabel(statusLabel)
                            .lastActivity(lastActivityMap.get(user.getId()))
                            .build());
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
        // Update last activity to affect status calculation
        if ("UP".equals(status)) {
            lastActivityMap.put(userId, System.currentTimeMillis());
        } else if ("DOWN".equals(status)) {
            lastActivityMap.put(userId, System.currentTimeMillis() - 90000000L); // >24h ago
        } else {
            lastActivityMap.put(userId, System.currentTimeMillis() - 43200000L); // 12h ago = warning
        }

        return ResponseEntity.ok(Map.of("success", true, "userId", userId, "newStatus", status));
    }

    /**
     * Calculate node status based on user ID and system health.
     * In production, this would use actual session data, heartbeats, etc.
     */
    private String calculateNodeStatus(Long userId, boolean systemUp) {
        if (!systemUp) {
            return "DOWN"; // All nodes down if system is down
        }

        Long lastActivity = lastActivityMap.get(userId);
        if (lastActivity == null) {
            // First time - randomize initial status
            int rand = random.nextInt(100);
            if (rand < 70)
                return "UP"; // 70% online
            if (rand < 90)
                return "WARNING"; // 20% warning
            return "DOWN"; // 10% offline
        }

        long hoursSinceActivity = (System.currentTimeMillis() - lastActivity) / 3600000;
        if (hoursSinceActivity < 1)
            return "UP";
        if (hoursSinceActivity < 24)
            return "WARNING";
        return "DOWN";
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
