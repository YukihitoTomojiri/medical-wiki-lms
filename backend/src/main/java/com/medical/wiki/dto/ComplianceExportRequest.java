package com.medical.wiki.dto;

import java.time.LocalDate;

public record ComplianceExportRequest(
        String facility,
        LocalDate startDate,
        LocalDate endDate) {
}
