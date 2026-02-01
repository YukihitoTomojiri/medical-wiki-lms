package com.medical.wiki.service;

import com.medical.wiki.entity.SystemLog;
import com.medical.wiki.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LoggingService {
    private final SystemLogRepository logRepository;

    @Transactional
    public void log(String action, String target, String description, String performedBy) {
        SystemLog log = SystemLog.builder()
                .timestamp(LocalDateTime.now())
                .action(action)
                .target(target)
                .description(description)
                .performedBy(performedBy)
                .build();
        logRepository.save(log);
    }
}
