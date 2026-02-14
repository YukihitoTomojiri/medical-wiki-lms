package com.medical.wiki.controller;

import com.medical.wiki.entity.TrainingEvent;
import com.medical.wiki.service.TrainingEventService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TrainingEventController {

    private final TrainingEventService trainingEventService;
    private final com.medical.wiki.repository.TrainingEventRepository trainingEventRepository;

    // Existing: Notification integration
    @GetMapping("/admin/training-events/upcoming")
    public List<TrainingEvent> getUpcomingTrainingEvents(
            @RequestHeader("X-User-Id") Long userId) {
        return trainingEventRepository.findAllByStartTimeAfterOrderByStartTimeAsc(LocalDateTime.now());
    }

    // --- New Endpoints matching api.ts ---

    // 1. GET /api/training/events (User visible events)
    @GetMapping("/training/events")
    public List<TrainingEvent> getTrainingEvents(
            @RequestHeader("X-User-Id") Long userId) {
        return trainingEventService.getVisibleEvents(userId);
    }

    // 2. GET /api/training/events/admin (Admin all events)
    @GetMapping("/training/events/admin")
    public List<TrainingEvent> getAdminTrainingEvents(
            @RequestHeader("X-User-Id") Long userId) {
        return trainingEventService.getAllEventsForAdmin(userId);
    }

    // 3. POST /api/training/events (Create)
    @PostMapping("/training/events")
    public TrainingEvent createTrainingEvent(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody TrainingEventRequest request) {
        return trainingEventService.createEvent(
                userId,
                request.getTitle(),
                request.getDescription(),
                request.getVideoUrl(),
                request.getVideoUrl2(),
                request.getVideoUrl3(),
                request.getMaterialsUrl(),
                request.getTargetCommitteeId(),
                request.getTargetJobType(),
                request.getStartTime(),
                request.getEndTime(),
                request.getIsAllFacilities());
    }

    // 4. GET /api/training/events/{id} (Read)
    @GetMapping("/training/events/{id}")
    public TrainingEvent getTrainingEvent(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        return trainingEventService.getEvent(userId, id);
    }

    // 5. PUT /api/training/events/{id} (Update)
    @PutMapping("/training/events/{id}")
    public TrainingEvent updateTrainingEvent(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id,
            @RequestBody TrainingEventRequest request) {
        return trainingEventService.updateEvent(
                userId,
                id,
                request.getTitle(),
                request.getDescription(),
                request.getVideoUrl(),
                request.getVideoUrl2(),
                request.getVideoUrl3(),
                request.getMaterialsUrl(),
                request.getTargetCommitteeId(),
                request.getTargetJobType(),
                request.getStartTime(),
                request.getEndTime(),
                request.getIsAllFacilities());
    }

    // 6. DELETE /api/training/events/{id} (Delete)
    @DeleteMapping("/training/events/{id}")
    public void deleteTrainingEvent(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        trainingEventService.deleteEvent(userId, id);
    }

    // 7. GET /api/training/events/{id}/qrcode
    @GetMapping("/training/events/{id}/qrcode")
    public QrCodeResponse getTrainingQrCode(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        String url = trainingEventService.getQrCodeUrl(id);
        return new QrCodeResponse(url);
    }

    @Data
    public static class TrainingEventRequest {
        private String title;
        private String description;
        private String videoUrl;
        private String videoUrl2;
        private String videoUrl3;
        private String materialsUrl;
        private Long targetCommitteeId;
        private String targetJobType;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Boolean isAllFacilities;
    }

    @Data
    public static class QrCodeResponse {
        private String url;

        public QrCodeResponse(String url) {
            this.url = url;
        }
    }
}
