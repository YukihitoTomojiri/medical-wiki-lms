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
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityAnomalyService {

    private final SecurityAnomalyRepository securityAnomalyRepository;
    private final SystemLogRepository systemLogRepository;

    private static final ZoneId JST = ZoneId.of("Asia/Tokyo");

    // Thresholds
    private static final int RAPID_IMPORTANT_ACTION_THRESHOLD = 5;
    private static final int RAPID_IMPORTANT_ACTION_WINDOW_MINUTES = 1;
    private static final int CONSECUTIVE_LOGIN_FAILURE_THRESHOLD = 3;

    private static final Set<String> IMPORTANT_ACTIONS = Set.of(
            "MANUAL_DOWNLOAD", "MANUAL_DELETE", "USER_DELETE", "USER_GRANT_ROLE");

    /**
     * Check for Rapid Important Action Anomaly
     * Rule: >5 important actions in 1 minute.
     */
    @Transactional
    public void checkImportantActionAnomaly(User user, String action, String ipAddress) {
        if (!IMPORTANT_ACTIONS.contains(action)) {
            return;
        }

        ZonedDateTime nowJst = ZonedDateTime.now(JST);
        LocalDateTime now = nowJst.toLocalDateTime();
        LocalDateTime since = now.minusMinutes(RAPID_IMPORTANT_ACTION_WINDOW_MINUTES);

        long count = systemLogRepository.countByPerformedByAndActionAndTimestampAfter(
                user.getEmployeeId(), action, since);

        if (count >= RAPID_IMPORTANT_ACTION_THRESHOLD) {
            long recentAlerts = securityAnomalyRepository.countByUserIdAndTypeAndDetectedAtAfter(
                    user.getId(), AnomalyType.RAPID_ACCESS, since.minusMinutes(5));

            if (recentAlerts == 0) {
                createAnomaly(
                        AnomalyType.RAPID_ACCESS,
                        user,
                        Severity.HIGH,
                        String.format("短時間の重要操作検知(%s: %d回/分)", action, count),
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
        LocalDateTime last24h = LocalDateTime.now(JST).minusHours(24);

        long totalOpen = securityAnomalyRepository.countOpenAlerts();
        long criticalOpen = securityAnomalyRepository.countCriticalOpenAlerts();
        // Note: Repository needs method for 24h count.
        // Or I can just fetch all open/recent and count in memory if dataset is small?
        // Better to add repository method `countByDetectedAtAfter(LocalDateTime
        // since)`.
        long alerts24h = securityAnomalyRepository.countByDetectedAtAfter(last24h);

        return Map.of(
                "totalOpen", totalOpen,
                "criticalOpen", criticalOpen,
                "alerts24h", alerts24h);
    }

    // ... rest of the file ... (acknowledgeAlert, resolveAlert, createAnomaly)

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
