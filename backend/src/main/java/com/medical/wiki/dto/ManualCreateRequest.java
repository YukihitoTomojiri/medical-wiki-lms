package com.medical.wiki.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManualCreateRequest {
    private String title;
    private String content;
    private String category;
    private String pdfPath;
}
