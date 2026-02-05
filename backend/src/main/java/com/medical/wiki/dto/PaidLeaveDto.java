package com.medical.wiki.dto;

import com.medical.wiki.entity.PaidLeave;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class PaidLeaveDto {
    private Long id;
    private Long userId;
    private String userName;
    private String userFacility;
    private String userDepartment;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PaidLeaveDto fromEntity(PaidLeave entity) {
        return PaidLeaveDto.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .userName(entity.getUser().getName())
                .userFacility(entity.getUser().getFacility())
                .userDepartment(entity.getUser().getDepartment())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .reason(entity.getReason())
                .status(entity.getStatus().name())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
