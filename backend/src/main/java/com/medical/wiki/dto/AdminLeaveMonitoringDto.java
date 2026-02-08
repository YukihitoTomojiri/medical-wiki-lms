package com.medical.wiki.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class AdminLeaveMonitoringDto {
    private Long userId;
    private String userName;
    private String employeeId;
    private String facilityName;
    private LocalDate joinedDate;

    // Balance
    private Double currentPaidLeaveDays;

    // Obligation (5 days rule)
    private Double obligatoryDaysTaken;
    private Double obligatoryTarget;
    private Boolean isObligationMet;
    private Boolean needsAttention;

    // Cycle Info
    // Cycle Info
    private LocalDate currentCycleStart;
    private LocalDate currentCycleEnd;
    private Double daysRemainingToObligation;

    // New API requirements
    private LocalDate baseDate; // 6 months after hire, then +1y
    private LocalDate targetEndDate; // baseDate + 1y
    private Boolean isViolation; // If period ended and < 5 days
}
