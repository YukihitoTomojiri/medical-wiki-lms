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
    public ResponseEntity<List<UserDto>> getAllUsers(@RequestParam(required = false) String facility) {
        return ResponseEntity.ok(userService.getAllUsers(facility));
    }

    @GetMapping("/facilities")
    public ResponseEntity<List<String>> getDistinctFacilities() {
        return ResponseEntity.ok(userService.getDistinctFacilities());
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

    private final com.medical.wiki.service.PaidLeaveService paidLeaveService;

    @GetMapping("/me/history")
    public ResponseEntity<List<com.medical.wiki.dto.HistoryDto>> getMyHistory(
            @RequestHeader(value = "X-User-Id") Long userId,
            @RequestParam(required = false) java.time.LocalDate startDate) {
        if (startDate == null) {
            // Default to 1 year ago
            startDate = java.time.LocalDate.now().minusYears(1);
        }
        return ResponseEntity.ok(userService.getHistory(userId, startDate));
    }

    @GetMapping("/me/leave-status")
    public ResponseEntity<com.medical.wiki.dto.PaidLeaveStatusDto> getLeaveStatus(
            @RequestHeader(value = "X-User-Id") Long userId) {
        return ResponseEntity.ok(paidLeaveService.calculateCurrentBalance(userId));
    }

}
