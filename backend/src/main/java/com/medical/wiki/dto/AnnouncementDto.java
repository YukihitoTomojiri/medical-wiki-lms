package com.medical.wiki.dto;

import com.medical.wiki.entity.Announcement;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AnnouncementDto {
    private Long id;
    private String title;
    private String content;
    private Announcement.Priority priority;
    private LocalDate displayUntil;
    private Long facilityId;
    private LocalDateTime createdAt;

    // Optional: minimalistic creator info if needed
    private String createdByName;

    // 研修マニュアル連携
    private Long relatedWikiId;
    private String relatedWikiTitle;

    // 研修会連携
    private Long relatedEventId;
    private String relatedEventTitle;
    private String relatedType; // "WIKI" or "EVENT"
}
