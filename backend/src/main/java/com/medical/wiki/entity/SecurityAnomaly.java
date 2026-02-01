package com.medical.wiki.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_anomalies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAnomaly {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AnomalyType type;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_employee_id")
    private String userEmployeeId;

    @Column(name = "user_name")
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(length = 500)
    private String description;

    @Column(name = "ip_address")
    private String ipAddress;

    public enum AnomalyType {
        LATE_NIGHT_ACCESS, // 深夜帯アクセス (00:00 - 05:00 JST)
        RAPID_ACCESS, // 短時間閾値超えアクセス
        MASS_DOWNLOAD, // 大量ダウンロード
        LOGIN_FAILURE // ログイン失敗
    }

    public enum Severity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public enum Status {
        OPEN,
        ACKNOWLEDGED,
        RESOLVED
    }
}
