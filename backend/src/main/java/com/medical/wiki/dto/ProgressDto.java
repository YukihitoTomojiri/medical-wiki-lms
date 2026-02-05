package com.medical.wiki.dto;

import com.medical.wiki.entity.Progress;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ProgressDto {
    private Long id;
    private Long userId;
    private Long manualId;
    private String manualTitle;
    private String category;
    private LocalDateTime readAt;

    public static ProgressDto fromEntity(Progress entity) {
        return ProgressDto.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .manualId(entity.getManual().getId())
                .manualTitle(entity.getManual().getTitle())
                .category(entity.getManual().getCategory())
                .readAt(entity.getReadAt())
                .build();
    }
}
