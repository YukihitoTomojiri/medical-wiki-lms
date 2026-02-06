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
    private Double paidLeaveDays;
    private java.time.LocalDate joinedDate;

    public static UserDto fromEntity(User user) {
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
                .paidLeaveDays(user.getPaidLeaveDays() != null ? user.getPaidLeaveDays() : 0.0)
                .joinedDate(user.getJoinedDate())
                .build();
    }
}
