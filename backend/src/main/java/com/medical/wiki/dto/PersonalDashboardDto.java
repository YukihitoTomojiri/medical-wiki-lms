package com.medical.wiki.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PersonalDashboardDto {
    private int completedManualsCount;
    private int totalManualsCount;
    private int monthlyReadCount;
    private String lastReadDate;

    private int pendingLeaveRequestsCount;
    private int approvedLeaveRequestsCount;
    private int paidLeaveDays;

    private int unreadNotificationsCount;
}
