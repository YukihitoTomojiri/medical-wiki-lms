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

    // 関連コンテンツ（Wiki または 研修会）
    private Long relatedWikiId;
    private String relatedWikiTitle;
    private Long relatedEventId;
    private String relatedEventTitle;
    private String relatedType; // "WIKI" or "EVENT" or null
}
