package com.medical.wiki.controller;

import com.medical.wiki.entity.Announcement;
import com.medical.wiki.entity.TrainingRecord;
import com.medical.wiki.repository.AnnouncementRepository;
import com.medical.wiki.repository.TrainingRecordRepository;
import com.medical.wiki.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TrainingRecordController {

    private final TrainingRecordRepository trainingRecordRepository;
    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    // 受講完了を記録
    @PostMapping("/training-records")
    public ResponseEntity<?> completeTraining(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody CompleteRequest request) {

        // 既に完了済みかチェック
        if (trainingRecordRepository.findByAnnouncementIdAndUserId(request.getAnnouncementId(), userId).isPresent()) {
            return ResponseEntity.ok(Map.of("message", "既に受講完了済みです", "alreadyCompleted", true));
        }

        // お知らせの存在確認と紐付きWiki確認
        Announcement announcement = announcementRepository.findById(request.getAnnouncementId())
                .orElseThrow(() -> new RuntimeException("Announcement not found"));

        if (announcement.getRelatedWikiId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "このお知らせには研修が紐付いていません"));
        }

        TrainingRecord record = TrainingRecord.builder()
                .announcementId(request.getAnnouncementId())
                .manualId(announcement.getRelatedWikiId())
                .userId(userId)
                .build();

        trainingRecordRepository.save(record);
        return ResponseEntity.ok(Map.of("message", "受講完了を記録しました", "alreadyCompleted", false));
    }

    // 自分がこのお知らせの研修を完了済みか確認
    @GetMapping("/training-records/check")
    public ResponseEntity<?> checkCompletion(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam Long announcementId) {
        boolean completed = trainingRecordRepository
                .findByAnnouncementIdAndUserId(announcementId, userId).isPresent();
        return ResponseEntity.ok(Map.of("completed", completed));
    }

    // 管理者向け: お知らせの研修完了統計
    @GetMapping("/admin/training-records/stats")
    public ResponseEntity<?> getTrainingStats(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) Long announcementId) {

        if (announcementId != null) {
            long completedCount = trainingRecordRepository.countByAnnouncementId(announcementId);
            long totalUsers = userRepository.countByDeletedAtIsNull();
            return ResponseEntity.ok(Map.of(
                    "announcementId", announcementId,
                    "completedCount", completedCount,
                    "totalUsers", totalUsers));
        }

        // 全お知らせの統計（研修紐付きのもののみ）
        List<Announcement> withWiki = announcementRepository.findAll().stream()
                .filter(a -> a.getRelatedWikiId() != null && a.getDeletedAt() == null)
                .toList();

        long totalUsers = userRepository.countByDeletedAtIsNull();
        List<Map<String, Object>> stats = withWiki.stream().map(a -> {
            long completed = trainingRecordRepository.countByAnnouncementId(a.getId());
            return Map.<String, Object>of(
                    "announcementId", a.getId(),
                    "announcementTitle", a.getTitle(),
                    "relatedWikiId", a.getRelatedWikiId(),
                    "completedCount", completed,
                    "totalUsers", totalUsers);
        }).toList();

        return ResponseEntity.ok(stats);
    }

    @Data
    public static class CompleteRequest {
        private Long announcementId;
    }
}
