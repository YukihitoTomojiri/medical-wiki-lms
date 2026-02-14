package com.medical.wiki.controller;

import com.medical.wiki.entity.Announcement;
import com.medical.wiki.service.AnnouncementService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import com.medical.wiki.dto.AnnouncementDto;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    // Existing users (Dashboard)
    @GetMapping("/announcements")
    public List<AnnouncementDto> getMyAnnouncements(@RequestHeader(value = "X-User-Id") Long userId) {
        return announcementService.getAnnouncementsForUser(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Admin/Developer Management API
    @GetMapping("/admin/announcements")
    public List<AnnouncementDto> getManageableAnnouncements(@RequestHeader(value = "X-User-Id") Long userId) {
        return announcementService.getManageableAnnouncements(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @PostMapping("/admin/announcements")
    public AnnouncementDto createAnnouncement(
            @RequestHeader(value = "X-User-Id") Long userId,
            @RequestBody AnnouncementRequest request) {
        Announcement announcement = announcementService.createAnnouncement(
                userId,
                request.getTitle(),
                request.getContent(),
                request.getPriority(),
                request.getDisplayUntil(),
                request.getFacilityId(),
                request.getRelatedWikiId(),
                request.getRelatedEventId(),
                request.getRelatedType());
        return toDto(announcement);
    }

    @PutMapping("/admin/announcements/{id}")
    public AnnouncementDto updateAnnouncement(
            @RequestHeader(value = "X-User-Id") Long userId,
            @PathVariable Long id,
            @RequestBody AnnouncementRequest request) {
        Announcement announcement = announcementService.updateAnnouncement(
                userId,
                id,
                request.getTitle(),
                request.getContent(),
                request.getPriority(),
                request.getDisplayUntil(),
                request.getRelatedWikiId(),
                request.getRelatedEventId(),
                request.getRelatedType());
        return toDto(announcement);
    }

    @DeleteMapping("/admin/announcements/{id}")
    public void deleteAnnouncement(
            @RequestHeader(value = "X-User-Id") Long userId,
            @PathVariable Long id) {
        announcementService.deleteAnnouncement(userId, id);
    }

    private AnnouncementDto toDto(Announcement announcement) {
        String wikiTitle = announcementService.getWikiTitle(announcement.getRelatedWikiId());
        return AnnouncementDto.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .priority(announcement.getPriority())
                .displayUntil(announcement.getDisplayUntil())
                .facilityId(announcement.getFacilityId())
                .createdAt(announcement.getCreatedAt())
                .createdByName(announcement.getCreatedBy() != null ? announcement.getCreatedBy().getName() : "Unknown")
                .relatedWikiId(announcement.getRelatedWikiId())
                .relatedWikiTitle(wikiTitle)
                .relatedEventId(announcement.getRelatedEventId())
                .relatedEventTitle(announcementService.getEventTitle(announcement.getRelatedEventId()))
                .relatedType(announcement.getRelatedType())
                .build();
    }

    @Data
    public static class AnnouncementRequest {
        private String title;
        private String content;
        private Announcement.Priority priority;
        private LocalDate displayUntil;
        private Long facilityId; // Optional, null for global
        private Long relatedWikiId; // Optional
        private Long relatedEventId; // Optional
        private String relatedType; // "WIKI" or "TRAINING_EVENT"
    }
}
