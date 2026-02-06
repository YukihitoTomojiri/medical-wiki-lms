package com.medical.wiki.dto;

import com.medical.wiki.entity.User;

public record UserCreateDto(
                String employeeId,
                String name,
                String password,
                String facility,
                String department,
                User.Role role,
                String email,
                Double paidLeaveDays,
                java.time.LocalDate joinedDate) {
}
