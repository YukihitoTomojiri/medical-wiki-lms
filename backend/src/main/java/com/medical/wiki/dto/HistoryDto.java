package com.medical.wiki.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class HistoryDto {
    private Long id;
    private String type; // PAID_LEAVE, ABSENCE, LATE, EARLY_DEPARTURE
    private String status; // PENDING, APPROVED, REJECTED
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private String rejectionReason;
    private String durationType; // FULL, HALF_AM, HALF_PM (for PaidLeave: derived from leaveType)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
