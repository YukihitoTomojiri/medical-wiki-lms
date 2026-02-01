package com.medical.wiki.dto;

import com.medical.wiki.entity.Progress;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressDto {
    private Long id;
    private Long manualId;
    private String manualTitle;
    private String category;
    private LocalDateTime readAt;

    public static ProgressDto fromEntity(Progress progress) {
        return ProgressDto.builder()
                .id(progress.getId())
                .manualId(progress.getManual().getId())
                .manualTitle(progress.getManual().getTitle())
                .category(progress.getManual().getCategory())
                .readAt(progress.getReadAt())
                .build();
    }
}
