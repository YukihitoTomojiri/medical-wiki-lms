package com.medical.wiki.dto;

import com.medical.wiki.entity.AttendanceRequest;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
@Builder
public class AttendanceRequestDto {
    private Long id;
    private Long userId;
    private String userName;
    private String userFacility;
    private String userDepartment;
    private String type;
    private String durationType;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String reason;
    private String rejectionReason;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AttendanceRequestDto fromEntity(AttendanceRequest entity) {
        return AttendanceRequestDto.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .userName(entity.getUser().getName())
                .userFacility(entity.getUser().getFacility())
                .userDepartment(entity.getUser().getDepartment())
                .type(entity.getType().name())
                .durationType(entity.getDurationType() != null ? entity.getDurationType().name() : null)
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .reason(entity.getReason())
                .rejectionReason(entity.getRejectionReason())
                .status(entity.getStatus().name())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
