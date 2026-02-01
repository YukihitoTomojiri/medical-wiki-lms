package com.medical.wiki.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String employeeId;
    private String password;
}
