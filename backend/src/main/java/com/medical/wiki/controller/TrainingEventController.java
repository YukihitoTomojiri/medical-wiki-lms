package com.medical.wiki.controller;

import com.medical.wiki.entity.TrainingEvent;
import com.medical.wiki.repository.UserRepository;
import com.medical.wiki.service.TrainingEventService;
import com.medical.wiki.config.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/training/events")
@RequiredArgsConstructor
public class TrainingEventController {

    private final TrainingEventService trainingEventService;
    private final UserRepository userRepository;

    @GetMapping
    public List<TrainingEvent> getEvents(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        // If Admin/Developer, maybe show all or separate endpoint?
        // For now, reuse getVisibleEvents which handles logic inside service
        // Actually, service says Admin logic is TODO.
        // Let's rely on service logic.
        return trainingEventService.getVisibleEvents(userPrincipal.getId());
    }

    @GetMapping("/admin")
    public List<TrainingEvent> getAdminEvents(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return trainingEventService.getAllEventsForAdmin(userPrincipal.getId());
    }

    @GetMapping("/{id}")
    public TrainingEvent getEvent(@AuthenticationPrincipal UserPrincipal userPrincipal, @PathVariable Long id) {
        return trainingEventService.getEvent(userPrincipal.getId(), id);
    }

    @PostMapping
    public TrainingEvent createEvent(@AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> payload) {
        // Extract fields manually or use DTO. Manual for speed now.
        String title = (String) payload.get("title");
        String description = (String) payload.get("description");
        String videoUrl = (String) payload.get("videoUrl");
        String videoUrl2 = (String) payload.get("videoUrl2");
        String videoUrl3 = (String) payload.get("videoUrl3");
        String materialsUrl = (String) payload.get("materialsUrl");
        Long targetCommitteeId = payload.get("targetCommitteeId") != null
                ? ((Number) payload.get("targetCommitteeId")).longValue()
                : null;
        String targetJobType = (String) payload.get("targetJobType");

        String startTimeStr = (String) payload.get("startTime");
        String endTimeStr = (String) payload.get("endTime");

        LocalDateTime startTime;
        LocalDateTime endTime;

        try {
            startTime = (startTimeStr != null && !startTimeStr.contains("T"))
                    ? LocalDateTime.parse(startTimeStr + "T00:00:00")
                    : LocalDateTime.parse(startTimeStr);
            endTime = (endTimeStr != null && !endTimeStr.contains("T"))
                    ? LocalDateTime.parse(endTimeStr + "T23:59:59")
                    : LocalDateTime.parse(endTimeStr);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format: " + e.getMessage());
        }

        return trainingEventService.createEvent(userPrincipal.getId(), title, description, videoUrl, videoUrl2,
                videoUrl3,
                materialsUrl, targetCommitteeId, targetJobType, startTime, endTime);
    }

    @GetMapping("/{id}/qrcode")
    public ResponseEntity<Map<String, String>> getQrCode(@PathVariable Long id) {
        String url = trainingEventService.getQrCodeUrl(id);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PutMapping("/{id}")
    public TrainingEvent updateEvent(@AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        String title = (String) payload.get("title");
        String description = (String) payload.get("description");
        String videoUrl = (String) payload.get("videoUrl");
        String videoUrl2 = (String) payload.get("videoUrl2");
        String videoUrl3 = (String) payload.get("videoUrl3");
        String materialsUrl = (String) payload.get("materialsUrl");
        Long targetCommitteeId = payload.get("targetCommitteeId") != null
                ? ((Number) payload.get("targetCommitteeId")).longValue()
                : null;
        String targetJobType = (String) payload.get("targetJobType");

        String startTimeStr = (String) payload.get("startTime");
        String endTimeStr = (String) payload.get("endTime");

        LocalDateTime startTime;
        LocalDateTime endTime;

        try {
            startTime = (startTimeStr != null && !startTimeStr.contains("T"))
                    ? LocalDateTime.parse(startTimeStr + "T00:00:00")
                    : LocalDateTime.parse(startTimeStr);
            endTime = (endTimeStr != null && !endTimeStr.contains("T"))
                    ? LocalDateTime.parse(endTimeStr + "T23:59:59")
                    : LocalDateTime.parse(endTimeStr);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format: " + e.getMessage());
        }

        return trainingEventService.updateEvent(userPrincipal.getId(), id, title, description, videoUrl, videoUrl2,
                videoUrl3,
                materialsUrl, targetCommitteeId, targetJobType, startTime, endTime);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        trainingEventService.deleteEvent(userPrincipal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
