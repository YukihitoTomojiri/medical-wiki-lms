package com.medical.wiki.dto;

import com.medical.wiki.entity.Manual;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualDto {
    private Long id;
    private String title;
    private String content;
    private String category;
    private String authorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isRead;
    private String pdfUrl;

    public static ManualDto fromEntity(Manual manual) {
        return ManualDto.builder()
                .id(manual.getId())
                .title(manual.getTitle())
                .content(manual.getContent())
                .category(manual.getCategory())
                .authorName(manual.getAuthor().getName())
                .createdAt(manual.getCreatedAt())
                .updatedAt(manual.getUpdatedAt())
                .isRead(false)
                .pdfUrl(manual.getPdfPath() != null ? "/api/manuals/" + manual.getId() + "/pdf" : null)
                .build();
    }

    public static ManualDto fromEntity(Manual manual, boolean isRead) {
        ManualDto dto = fromEntity(manual);
        dto.setRead(isRead);
        return dto;
    }
}
