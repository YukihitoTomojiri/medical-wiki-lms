package com.medical.wiki.dto;

import com.medical.wiki.entity.User;

public record UserUpdateDto(
        User.Role role,
        String facility,
        String department,
        String email,
        Double paidLeaveDays,
        java.time.LocalDate joinedDate,
        Double initialAdjustmentDays) {
}
