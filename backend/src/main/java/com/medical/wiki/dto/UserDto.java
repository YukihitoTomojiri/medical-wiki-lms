package com.medical.wiki.dto;

import com.medical.wiki.entity.User;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String employeeId;
    private String name;
    private String facility;
    private String department;
    private String role;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
    private java.time.LocalDateTime deletedAt;
    private Boolean mustChangePassword;
    private String invitationToken;
    private String email;
    private java.time.LocalDate joinedDate;
    private Double initialAdjustmentDays;
    private Double statutoryLeaveDays;
    private Double usedLeaveDays;
    private Double remainingLeaveDays;
    private Double paidLeaveDays; // Alias for remainingLeaveDays for backward compatibility

    public static UserDto fromEntity(User user) {
        Double initialAdj = user.getInitialAdjustmentDays() != null ? user.getInitialAdjustmentDays() : 0.0;
        return UserDto.builder()
                .id(user.getId())
                .employeeId(user.getEmployeeId())
                .name(user.getName())
                .facility(user.getFacility())
                .department(user.getDepartment())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .deletedAt(user.getDeletedAt())
                .mustChangePassword(user.getMustChangePassword())
                .invitationToken(user.getInvitationToken())
                .email(user.getEmail())
                .joinedDate(user.getJoinedDate())
                .initialAdjustmentDays(initialAdj)
                .paidLeaveDays(user.getPaidLeaveDays() != null ? user.getPaidLeaveDays() : 0.0)
                .build();
    }
}
