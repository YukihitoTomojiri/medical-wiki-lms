package com.medical.wiki.service;

import com.medical.wiki.dto.SecurityAnomalyDto;
import com.medical.wiki.entity.SecurityAnomaly;
import com.medical.wiki.entity.SecurityAnomaly.AnomalyType;
import com.medical.wiki.entity.SecurityAnomaly.Severity;
import com.medical.wiki.entity.SecurityAnomaly.Status;
import com.medical.wiki.entity.User;
import com.medical.wiki.entity.SystemLog;
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

    // Late Night Definition (00:00 - 05:00 JST)
    private static final int LATE_NIGHT_START_HOUR = 0;
    private static final int LATE_NIGHT_END_HOUR = 5;

    // Thresholds
    private static final int LATE_NIGHT_DOWNLOAD_THRESHOLD = 5;
    private static final int LATE_NIGHT_DOWNLOAD_WINDOW_MINUTES = 1;

    private static final int CONSECUTIVE_LOGIN_FAILURE_THRESHOLD = 3;

    /**
     * Check for Late Night Mass Download Anomaly
     * Rule: Late Night (0-5) AND >5 downloads in 1 minute.
     */
    @Transactional
    public void checkDownloadAnomaly(User user, String ipAddress) {
        ZonedDateTime nowJst = ZonedDateTime.now(JST);

        // Only check if Late Night
        if (!isLateNightAccess(nowJst)) {
            return;
        }

        LocalDateTime now = nowJst.toLocalDateTime();
        LocalDateTime since = now.minusMinutes(LATE_NIGHT_DOWNLOAD_WINDOW_MINUTES);

        long count = systemLogRepository.countByPerformedByAndActionAndTimestampAfter(
                user.getEmployeeId(), "MANUAL_DOWNLOAD", since);

        if (count >= LATE_NIGHT_DOWNLOAD_THRESHOLD) {
            // Check for recent alerts to avoid duplicate spam
            long recentAlerts = securityAnomalyRepository.countByUserIdAndTypeAndDetectedAtAfter(
                    user.getId(), AnomalyType.MASS_DOWNLOAD, since.minusMinutes(5)); // Debounce 5 mins

            if (recentAlerts == 0) {
                createAnomaly(
                        AnomalyType.MASS_DOWNLOAD,
                        user,
                        Severity.HIGH,
                        String.format("深夜帯(%d件/分)の大量ダウンロードを検知", count),
                        ipAddress,
                        now);
            }
        }
    }

    /**
     * Check for Consecutive Login Failures
     * Rule: 3 consecutive failures by same user.
     */
    @Transactional
    public void checkLoginFailure(String employeeId, String ipAddress) {
        List<SystemLog> lastLogs = systemLogRepository.findTop3ByPerformedByOrderByTimestampDesc(employeeId);

        if (lastLogs.size() < CONSECUTIVE_LOGIN_FAILURE_THRESHOLD) {
            return;
        }

        // Check if all are LOGIN_FAILURE
        boolean allFailures = lastLogs.stream()
                .allMatch(log -> "LOGIN_FAILURE".equals(log.getAction()));

        if (allFailures) {
            LocalDateTime now = ZonedDateTime.now(JST).toLocalDateTime();

            // Check if alert already exists recently (e.g. in last 10 mins)
            // Note: repository countByUserId... uses Long userId. We might not have userId
            // for failed login if users don't exist.
            // But we can check via manual query or just ignore dedupe for invalid users?
            // Or add countByEmployeeId... to repo.
            // For now, let's assume valid users mostly.
            // If employeeId corresponds to a user, we can fetch userId?
            // Actually, let's stick to simple logic: Just record it strictly.
            // But deduplication is good.

            // Since we don't have User object easily here without repo, let's just record.
            // The constraint "Only record..." implies we should be strict on triggering
            // conditions.
            // If user keeps failing, we keep recording every 3rd failure? (1,2,3 -> alert.
            // 2,3,4 -> alert?)
            // If I look at top 3, and they are F,F,F.
            // When 4th failure comes, top 3 are F,F,F (newest). Alert again.
            // This is acceptable behavior for brute force attack (noisy is better than
            // silent).

            SecurityAnomaly anomaly = SecurityAnomaly.builder()
                    .type(AnomalyType.LOGIN_FAILURE)
                    .detectedAt(now)
                    .userEmployeeId(employeeId)
                    .severity(Severity.HIGH) // Consecutive failures are high risk
                    .status(Status.OPEN)
                    .description(String.format("3回以上の連続ログイン失敗 (ID: %s)", employeeId))
                    .ipAddress(ipAddress)
                    .build();

            securityAnomalyRepository.save(anomaly);
            log.warn("Consecutive login failure detected for employee: {}", employeeId);
        }
    }

    // Existing methods (Getters, Helpers)

    public List<SecurityAnomalyDto> getAllAlerts() {
        return securityAnomalyRepository.findTop50ByOrderByDetectedAtDesc()
                .stream()
                .map(SecurityAnomalyDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SecurityAnomalyDto> getOpenAlerts() {
        return securityAnomalyRepository.findByStatusOrderByDetectedAtDesc(Status.OPEN)
                .stream()
                .map(SecurityAnomalyDto::fromEntity)
                .collect(Collectors.toList());
    }

    public Map<String, Long> getAlertStats() {
        return Map.of(
                "totalOpen", securityAnomalyRepository.countOpenAlerts(),
                "criticalOpen", securityAnomalyRepository.countCriticalOpenAlerts());
    }

    @Transactional
    public SecurityAnomalyDto acknowledgeAlert(Long id) {
        SecurityAnomaly anomaly = securityAnomalyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + id));
        anomaly.setStatus(Status.ACKNOWLEDGED);
        securityAnomalyRepository.save(anomaly);
        return SecurityAnomalyDto.fromEntity(anomaly);
    }

    @Transactional
    public SecurityAnomalyDto resolveAlert(Long id) {
        SecurityAnomaly anomaly = securityAnomalyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + id));
        anomaly.setStatus(Status.RESOLVED);
        securityAnomalyRepository.save(anomaly);
        return SecurityAnomalyDto.fromEntity(anomaly);
    }

    // Helpers

    private boolean isLateNightAccess(ZonedDateTime jstTime) {
        int hour = jstTime.getHour();
        return hour >= LATE_NIGHT_START_HOUR && hour < LATE_NIGHT_END_HOUR;
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
