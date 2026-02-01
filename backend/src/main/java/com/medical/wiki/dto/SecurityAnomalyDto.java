package com.medical.wiki.dto;

import com.medical.wiki.entity.SecurityAnomaly;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAnomalyDto {
    private Long id;
    private String type;
    private String typeDisplayName;
    private LocalDateTime detectedAt;
    private Long userId;
    private String userEmployeeId;
    private String userName;
    private String severity;
    private String status;
    private String description;
    private String ipAddress;

    public static SecurityAnomalyDto fromEntity(SecurityAnomaly entity) {
        return SecurityAnomalyDto.builder()
                .id(entity.getId())
                .type(entity.getType().name())
                .typeDisplayName(getTypeDisplayName(entity.getType()))
                .detectedAt(entity.getDetectedAt())
                .userId(entity.getUserId())
                .userEmployeeId(entity.getUserEmployeeId())
                .userName(entity.getUserName())
                .severity(entity.getSeverity().name())
                .status(entity.getStatus().name())
                .description(entity.getDescription())
                .ipAddress(entity.getIpAddress())
                .build();
    }

    private static String getTypeDisplayName(SecurityAnomaly.AnomalyType type) {
        return switch (type) {
            case LATE_NIGHT_ACCESS -> "深夜帯アクセス";
            case RAPID_ACCESS -> "短時間大量アクセス";
            case MASS_DOWNLOAD -> "大量ダウンロード";
            case LOGIN_FAILURE -> "ログイン失敗";
        };
    }
}
