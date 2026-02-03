package com.medical.wiki.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for node (user) status information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeStatusDto {
    private Long userId;
    private String name;
    private String facility;
    private String department;
    private String status; // UP, DOWN, WARNING
    private String statusLabel; // 稼働中, 停止中, 警告あり
    private String statusDetail; // Detailed reason: 通信途絶, リソース不足, etc.
    private Long lastActivity; // timestamp of last login/activity
    private Boolean isAlert; // true if status requires attention (WARNING or DOWN)
    private HealthMetrics healthMetrics; // System health metrics

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthMetrics {
        private Double memoryUsagePercent;
        private Long dbPingMs;
        private Boolean dbConnected;
        private String warningReason;
    }
}
