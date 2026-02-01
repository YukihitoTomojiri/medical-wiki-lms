package com.medical.wiki.service;

import com.medical.wiki.dto.SecurityAnomalyDto;
import com.medical.wiki.entity.SecurityAnomaly;
import com.medical.wiki.entity.SecurityAnomaly.AnomalyType;
import com.medical.wiki.entity.SecurityAnomaly.Severity;
import com.medical.wiki.entity.SecurityAnomaly.Status;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.SecurityAnomalyRepository;
import com.medical.wiki.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityAnomalyService {

    private final SecurityAnomalyRepository securityAnomalyRepository;
    private final SystemLogRepository systemLogRepository;

    private static final ZoneId JST = ZoneId.of("Asia/Tokyo");

    // 深夜帯の定義 (00:00 - 05:00 JST)
    private static final int LATE_NIGHT_START_HOUR = 0;
    private static final int LATE_NIGHT_END_HOUR = 5;

    // 短時間閾値 (1分間に10回以上のアクセス)
    private static final int RAPID_ACCESS_THRESHOLD = 10;
    private static final int RAPID_ACCESS_WINDOW_MINUTES = 1;

    // 大量ダウンロード閾値 (5分間に10回以上)
    private static final int MASS_DOWNLOAD_THRESHOLD = 5; // Tweak for testing
    private static final int MASS_DOWNLOAD_WINDOW_MINUTES = 5;

    /**
     * アクセス時の異常検知を実行
     */
    @Transactional
    public void checkAccessAnomaly(User user, String action, String ipAddress) {
        ZonedDateTime nowJst = ZonedDateTime.now(JST);
        LocalDateTime now = nowJst.toLocalDateTime();

        // 1. 深夜帯アクセス検知
        if (isLateNightAccess(nowJst)) {
            // 重複検知を防ぐため、直近1時間以内に同種のアラートがないかチェック
            long recentLateNightAlerts = countRecentAnomalies(user.getId(), AnomalyType.LATE_NIGHT_ACCESS, 60);
            if (recentLateNightAlerts == 0) {
                createAnomaly(
                        AnomalyType.LATE_NIGHT_ACCESS,
                        user,
                        Severity.MEDIUM,
                        String.format("深夜 %02d:%02d のアクセスを検知 (アクション: %s)",
                                nowJst.getHour(), nowJst.getMinute(), action),
                        ipAddress,
                        now);
            }
        }

        // 2. 短時間大量アクセス検知 (Login以外)
        if (!"LOGIN".equals(action)) {
            long recentAccessCount = systemLogRepository.countByPerformedByAndActionAndTimestampAfter(
                    user.getEmployeeId(), action,
                    now.minusMinutes(RAPID_ACCESS_WINDOW_MINUTES));

            if (recentAccessCount > RAPID_ACCESS_THRESHOLD) {
                // Check if alert already exists recently
                long recentAlerts = countRecentAnomalies(user.getId(), AnomalyType.RAPID_ACCESS, 10);
                if (recentAlerts == 0) {
                    createAnomaly(
                            AnomalyType.RAPID_ACCESS,
                            user,
                            Severity.HIGH,
                            String.format("短時間(%d分)に%d回以上のアクセス(%s)を検知",
                                    RAPID_ACCESS_WINDOW_MINUTES, RAPID_ACCESS_THRESHOLD, action),
                            ipAddress,
                            now);
                }
            }
        }
    }

    /**
     * 大量ダウンロード検知
     */
    @Transactional
    public void checkMassDownload(User user, String ipAddress) {
        LocalDateTime since = ZonedDateTime.now(JST).minusMinutes(MASS_DOWNLOAD_WINDOW_MINUTES).toLocalDateTime();
        long count = systemLogRepository.countByPerformedByAndActionAndTimestampAfter(
                user.getEmployeeId(), "MANUAL_DOWNLOAD", since);

        if (count >= MASS_DOWNLOAD_THRESHOLD) {
            long recentAlerts = securityAnomalyRepository.countByUserIdAndTypeAndDetectedAtAfter(
                    user.getId(), AnomalyType.MASS_DOWNLOAD, since);

            if (recentAlerts == 0) {
                recordMassDownload(user, (int) count, ipAddress);
            }
        }
    }

    /**
     * ログイン失敗を記録
     */
    @Transactional
    public void recordLoginFailure(String employeeId, String ipAddress) {
        LocalDateTime now = ZonedDateTime.now(JST).toLocalDateTime();

        SecurityAnomaly anomaly = SecurityAnomaly.builder()
                .type(AnomalyType.LOGIN_FAILURE)
                .detectedAt(now)
                .userEmployeeId(employeeId)
                .severity(Severity.LOW)
                .status(Status.OPEN)
                .description(String.format("社員ID %s でのログイン失敗", employeeId))
                .ipAddress(ipAddress)
                .build();

        securityAnomalyRepository.save(anomaly);
        log.warn("Login failure recorded for employee: {}", employeeId);
    }

    /**
     * 大量ダウンロードを記録
     */
    @Transactional
    public void recordMassDownload(User user, int downloadCount, String ipAddress) {
        LocalDateTime now = ZonedDateTime.now(JST).toLocalDateTime();

        createAnomaly(
                AnomalyType.MASS_DOWNLOAD,
                user,
                Severity.HIGH,
                String.format("短時間に%d件のマニュアルダウンロードを検知", downloadCount),
                ipAddress,
                now);
    }

    /**
     * 全アラート一覧を取得
     */
    public List<SecurityAnomalyDto> getAllAlerts() {
        return securityAnomalyRepository.findTop50ByOrderByDetectedAtDesc()
                .stream()
                .map(SecurityAnomalyDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * オープン状態のアラートを取得
     */
    public List<SecurityAnomalyDto> getOpenAlerts() {
        return securityAnomalyRepository.findByStatusOrderByDetectedAtDesc(Status.OPEN)
                .stream()
                .map(SecurityAnomalyDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * アラート統計情報を取得
     */
    public Map<String, Long> getAlertStats() {
        return Map.of(
                "totalOpen", securityAnomalyRepository.countOpenAlerts(),
                "criticalOpen", securityAnomalyRepository.countCriticalOpenAlerts());
    }

    /**
     * アラートを確認済みにする
     */
    @Transactional
    public SecurityAnomalyDto acknowledgeAlert(Long id) {
        SecurityAnomaly anomaly = securityAnomalyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + id));
        anomaly.setStatus(Status.ACKNOWLEDGED);
        securityAnomalyRepository.save(anomaly);
        log.info("Alert {} acknowledged", id);
        return SecurityAnomalyDto.fromEntity(anomaly);
    }

    /**
     * アラートを解決済みにする
     */
    @Transactional
    public SecurityAnomalyDto resolveAlert(Long id) {
        SecurityAnomaly anomaly = securityAnomalyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + id));
        anomaly.setStatus(Status.RESOLVED);
        securityAnomalyRepository.save(anomaly);
        log.info("Alert {} resolved", id);
        return SecurityAnomalyDto.fromEntity(anomaly);
    }

    // ===== Private Helper Methods =====

    private boolean isLateNightAccess(ZonedDateTime jstTime) {
        int hour = jstTime.getHour();
        return hour >= LATE_NIGHT_START_HOUR && hour < LATE_NIGHT_END_HOUR;
    }

    private long countRecentAnomalies(Long userId, AnomalyType type, int minutes) {
        LocalDateTime since = ZonedDateTime.now(JST).minusMinutes(minutes).toLocalDateTime();
        return securityAnomalyRepository.countByUserIdAndTypeAndDetectedAtAfter(userId, type, since);
    }

    private void createAnomaly(AnomalyType type, User user, Severity severity,
            String description, String ipAddress, LocalDateTime detectedAt) {
        SecurityAnomaly anomaly = SecurityAnomaly.builder()
                .type(type)
                .detectedAt(detectedAt)
                .userId(user.getId())
                .userEmployeeId(user.getEmployeeId())
                .userName(user.getName())
                .severity(severity)
                .status(Status.OPEN)
                .description(description)
                .ipAddress(ipAddress)
                .build();

        securityAnomalyRepository.save(anomaly);
        log.warn("Security anomaly detected: {} for user {} ({})", type, user.getEmployeeId(), description);
    }
}
