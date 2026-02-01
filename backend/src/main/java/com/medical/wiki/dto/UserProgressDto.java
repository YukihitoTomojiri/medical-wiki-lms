package com.medical.wiki.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProgressDto {
    private Long userId;
    private String employeeId;
    private String name;
    private String facility;
    private String department;
    private int totalManuals;
    private int readManuals;
    private double progressPercentage;
    private List<ProgressDto> progressList;
}
