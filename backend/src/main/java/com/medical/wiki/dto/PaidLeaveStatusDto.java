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
}
