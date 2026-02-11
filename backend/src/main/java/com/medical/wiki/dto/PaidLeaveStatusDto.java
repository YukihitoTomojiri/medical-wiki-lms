package com.medical.wiki.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class PaidLeaveStatusDto {
    private Double remainingDays;
    private LocalDate nextGrantDate;
    private Double nextGrantDays;

    // Compliance (5-day rule)
    private Double obligatoryDaysTaken; // e.g., 3.5
    private Double obligatoryTarget; // 5.0
    private Boolean isObligationMet; // taken >= 5.0
    private Boolean isWarning; // true if met=false and approaching deadline
    private Double daysRemainingToObligation; // 5.0 - taken
    private LocalDate obligatoryDeadline; // Deadline for the 5-day rule
}
