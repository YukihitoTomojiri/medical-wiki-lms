package com.medical.wiki.dto;

import com.medical.wiki.entity.User;

public record UserUpdateDto(
    User.Role role,
    String facility,
    String department
) {}
