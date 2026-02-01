package com.medical.wiki.service;

import com.medical.wiki.entity.SecurityAnomaly;
import com.medical.wiki.entity.SecurityAnomaly.AnomalyType;
import com.medical.wiki.entity.SystemLog;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.SecurityAnomalyRepository;
import com.medical.wiki.repository.SystemLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityAnomalyServiceTest {

        @Mock
        private SecurityAnomalyRepository securityAnomalyRepository;

        @Mock
        private SystemLogRepository systemLogRepository;

        @InjectMocks
        private SecurityAnomalyService securityAnomalyService;

        private static final ZoneId JST = ZoneId.of("Asia/Tokyo");

        @Test
        void checkDownloadAnomaly_ShouldCreateAnomaly_WhenLateNightAndThresholdExceeded() {
                // Mock time to be Late Night (e.g. 02:00 JST)
                LocalDateTime lateNight = LocalDateTime.of(2026, 2, 1, 2, 0); // 02:00
                ZonedDateTime lateNightJst = ZonedDateTime.of(lateNight, JST);

                try (MockedStatic<ZonedDateTime> mockedTime = Mockito.mockStatic(ZonedDateTime.class)) {
                        mockedTime.when(() -> ZonedDateTime.now(JST)).thenReturn(lateNightJst);

                        // Arrange
                        User user = new User();
                        user.setId(1L);
                        user.setEmployeeId("TEST_LATE");
                        user.setName("Late User");

                        // Mock recent alerts (none)
                        when(securityAnomalyRepository.countByUserIdAndTypeAndDetectedAtAfter(
                                        eq(1L), eq(AnomalyType.MASS_DOWNLOAD), any(LocalDateTime.class)))
                                        .thenReturn(0L);

                        // Mock download count
                        when(systemLogRepository.countByPerformedByAndActionAndTimestampAfter(
                                        eq("TEST_LATE"), eq("MANUAL_DOWNLOAD"), any(LocalDateTime.class)))
                                        .thenReturn(10L); // Threshold is 5

                        // Act
                        securityAnomalyService.checkDownloadAnomaly(user, "127.0.0.1");

                        // Assert
                        verify(securityAnomalyRepository).save(any(SecurityAnomaly.class));
                }
        }

        @Test
        void checkDownloadAnomaly_ShouldNotCreateAnomaly_WhenDayTime() {
                // Mock time to be Day Time (e.g. 10:00 JST)
                LocalDateTime dayTime = LocalDateTime.of(2026, 2, 1, 10, 0);
                ZonedDateTime dayTimeJst = ZonedDateTime.of(dayTime, JST);

                try (MockedStatic<ZonedDateTime> mockedTime = Mockito.mockStatic(ZonedDateTime.class)) {
                        mockedTime.when(() -> ZonedDateTime.now(JST)).thenReturn(dayTimeJst);

                        // Arrange
                        User user = new User();
                        user.setEmployeeId("TEST_DAY");

                        // Act
                        securityAnomalyService.checkDownloadAnomaly(user, "127.0.0.1");

                        // Assert
                        verify(systemLogRepository, never()).countByPerformedByAndActionAndTimestampAfter(any(), any(),
                                        any());
                        verify(securityAnomalyRepository, never()).save(any());
                }
        }

        @Test
        void checkLoginFailure_ShouldCreateAnomaly_WhenConsecutiveFailures() {
                // Arrange
                String employeeId = "TEST_LOGIN_FAIL";

                // Mock 3 consecutive failures
                SystemLog log1 = new SystemLog();
                log1.setAction("LOGIN_FAILURE");
                SystemLog log2 = new SystemLog();
                log2.setAction("LOGIN_FAILURE");
                SystemLog log3 = new SystemLog();
                log3.setAction("LOGIN_FAILURE");
                List<SystemLog> logs = Arrays.asList(log1, log2, log3);

                when(systemLogRepository.findTop3ByPerformedByOrderByTimestampDesc(employeeId))
                                .thenReturn(logs);

                ZonedDateTime now = ZonedDateTime.of(2026, 2, 1, 12, 0, 0, 0, JST);

                try (MockedStatic<ZonedDateTime> mockedTime = Mockito.mockStatic(ZonedDateTime.class)) {
                        mockedTime.when(() -> ZonedDateTime.now(JST)).thenReturn(now);

                        // Act
                        securityAnomalyService.checkLoginFailure(employeeId, "127.0.0.1");

                        // Assert
                        verify(securityAnomalyRepository).save(any(SecurityAnomaly.class));
                }
        }

        @Test
        void checkLoginFailure_ShouldNotCreateAnomaly_WhenMixedSuccess() {
                // Arrange
                String employeeId = "TEST_MIXED";

                // Mock Mixed actions (Failure, Success, Failure)
                SystemLog log1 = new SystemLog();
                log1.setAction("LOGIN_FAILURE");
                SystemLog log2 = new SystemLog();
                log2.setAction("LOGIN"); // Success
                SystemLog log3 = new SystemLog();
                log3.setAction("LOGIN_FAILURE");
                List<SystemLog> logs = Arrays.asList(log1, log2, log3);

                when(systemLogRepository.findTop3ByPerformedByOrderByTimestampDesc(employeeId))
                                .thenReturn(logs);

                // Act
                securityAnomalyService.checkLoginFailure(employeeId, "127.0.0.1");

                // Assert
                verify(securityAnomalyRepository, never()).save(any());
        }
}
