package com.medical.wiki.controller;

import com.medical.wiki.entity.Announcement;
import com.medical.wiki.service.AnnouncementService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    // Existing users (Dashboard)
    @GetMapping("/announcements")
    public List<Announcement> getMyAnnouncements(@RequestHeader(value = "X-User-Id") Long userId) {
        return announcementService.getAnnouncementsForUser(userId);
    }

    // Admin/Developer Management API
    @GetMapping("/admin/announcements")
    public List<Announcement> getManageableAnnouncements(@RequestHeader(value = "X-User-Id") Long userId) {
        return announcementService.getManageableAnnouncements(userId);
    }

    @PostMapping("/admin/announcements")
    public Announcement createAnnouncement(
            @RequestHeader(value = "X-User-Id") Long userId,
            @RequestBody AnnouncementRequest request) {
        return announcementService.createAnnouncement(
                userId,
                request.getTitle(),
                request.getContent(),
                request.getPriority(),
                request.getDisplayUntil(),
                request.getFacilityId());
    }

    @PutMapping("/admin/announcements/{id}")
    public Announcement updateAnnouncement(
            @RequestHeader(value = "X-User-Id") Long userId,
            @PathVariable Long id,
            @RequestBody AnnouncementRequest request) {
        return announcementService.updateAnnouncement(
                userId,
                id,
                request.getTitle(),
                request.getContent(),
                request.getPriority(),
                request.getDisplayUntil());
    }

    @DeleteMapping("/admin/announcements/{id}")
    public void deleteAnnouncement(
            @RequestHeader(value = "X-User-Id") Long userId,
            @PathVariable Long id) {
        announcementService.deleteAnnouncement(userId, id);
    }

    @Data
    public static class AnnouncementRequest {
        private String title;
        private String content;
        private Announcement.Priority priority;
        private LocalDate displayUntil;
        private Long facilityId; // Optional, null for global
    }
}
