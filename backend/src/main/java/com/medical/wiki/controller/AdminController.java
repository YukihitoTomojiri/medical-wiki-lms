package com.medical.wiki.controller;

import com.medical.wiki.dto.AuditLogDto;
import com.medical.wiki.dto.UserDto;
import com.medical.wiki.repository.SystemLogRepository;
import com.medical.wiki.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final SystemLogRepository logRepository;
    private final UserService userService;

    @GetMapping("/audit-logs")
    public List<AuditLogDto> getAuditLogs() {
        return logRepository.findAllByOrderByTimestampDesc().stream()
                .map(AuditLogDto::fromEntity)
                .collect(Collectors.toList());
    }

    @PostMapping("/users/{id}/restore")
    public UserDto restoreUser(@PathVariable Long id, @RequestHeader(value = "X-User-Id", required = false) Long executorId) {
        userService.restoreUser(id, executorId);
        return userService.getUserById(id).orElseThrow(() -> new RuntimeException("User not found after restore"));
    }

    @GetMapping("/users/all-including-deleted")
    public List<UserDto> getAllUsersIncludingDeleted() {
        return userService.getAllUsersIncludingDeleted();
    }
}
