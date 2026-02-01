package com.medical.wiki.controller;

import com.medical.wiki.dto.UserDto;
import com.medical.wiki.dto.UserUpdateDto;
import com.medical.wiki.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserUpdateDto dto,
            @RequestHeader(value = "X-User-Id", required = false) Long executorId) {
        return ResponseEntity.ok(userService.updateUser(id, dto, executorId));
    }

    @PostMapping("/{id}/temp-password")
    public ResponseEntity<java.util.Map<String, String>> issueTempPassword(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long executorId) {
        String tempPassword = userService.issueTempPassword(id, executorId);
        return ResponseEntity.ok(java.util.Map.of("tempPassword", tempPassword));
    }

}
