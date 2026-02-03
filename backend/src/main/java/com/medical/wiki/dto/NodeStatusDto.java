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
    private Long lastActivity; // timestamp of last login/activity
}
