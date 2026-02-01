package com.medical.wiki.service;

import com.medical.wiki.dto.*;
import com.medical.wiki.entity.*;
import com.medical.wiki.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {
    private final ProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final ManualRepository manualRepository;
    private final LoggingService loggingService;

    @Transactional
    public ProgressDto markAsRead(Long userId, Long manualId) {

        // Check if already read
        Optional<Progress> existing = progressRepository.findByUserIdAndManualId(userId, manualId);
        if (existing.isPresent()) {
            return ProgressDto.fromEntity(existing.get());
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Manual manual = manualRepository.findById(manualId)
                .orElseThrow(() -> new RuntimeException("Manual not found"));

        Progress progress = Progress.builder()
                .user(user)
                .manual(manual)
                .readAt(LocalDateTime.now())
                .build();

        return ProgressDto.fromEntity(progressRepository.save(progress));
    }

    public List<ProgressDto> getMyProgress(Long userId) {
        return progressRepository.findByUserId(userId)
                .stream()
                .map(ProgressDto::fromEntity)
                .sorted(Comparator.comparing(ProgressDto::getReadAt).reversed())
                .collect(Collectors.toList());
    }

    public List<UserProgressDto> getAllUsersProgress() {
        List<User> allUsers = userRepository.findAllByRoleNot(User.Role.DEVELOPER);
        long totalManuals = manualRepository.count();

        return allUsers.stream()
                .map(user -> {
                    List<Progress> progressList = progressRepository.findByUserId(user.getId());
                    int readCount = progressList.size();
                    double percentage = totalManuals > 0 ? (readCount * 100.0 / totalManuals) : 0;

                    return UserProgressDto.builder()
                            .userId(user.getId())
                            .employeeId(user.getEmployeeId())
                            .name(user.getName())
                            .name(user.getName())
                            .facility(user.getFacility())
                            .department(user.getDepartment())
                            .totalManuals((int) totalManuals)
                            .readManuals(readCount)
                            .progressPercentage(Math.round(percentage * 10.0) / 10.0)
                            .progressList(progressList.stream()
                                    .map(ProgressDto::fromEntity)
                                    .collect(Collectors.toList()))
                            .build();
                })
                .sorted(Comparator.comparing(UserProgressDto::getName))
                .collect(Collectors.toList());
    }

    @Transactional
    public void resetProgress(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        String targetName = user != null ? user.getName() : "Unknown User (" + userId + ")";
        progressRepository.deleteByUserId(userId);
        loggingService.log("PROGRESS_RESET", targetName, "User progress reset", "ADMIN");
    }
}
