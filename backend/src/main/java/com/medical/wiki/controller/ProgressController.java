package com.medical.wiki.controller;

import com.medical.wiki.dto.*;
import com.medical.wiki.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {
    private final ProgressService progressService;

    @PostMapping("/{manualId}")
    public ResponseEntity<ProgressDto> markAsRead(
            @PathVariable Long manualId,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(progressService.markAsRead(userId, manualId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ProgressDto>> getMyProgress(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(progressService.getMyProgress(userId));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<UserProgressDto>> getAllUsersProgress() {
        return ResponseEntity.ok(progressService.getAllUsersProgress());
    }
}
