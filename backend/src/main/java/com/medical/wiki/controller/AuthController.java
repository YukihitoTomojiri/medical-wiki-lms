package com.medical.wiki.controller;

import com.medical.wiki.dto.*;
import com.medical.wiki.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
        private final AuthService authService;

        @PostMapping("/login")
        public ResponseEntity<?> login(@RequestBody LoginRequest request,
                        jakarta.servlet.http.HttpServletRequest servletRequest) {
                String ipAddress = servletRequest.getRemoteAddr();
                return authService.authenticate(request, ipAddress)
                                .map(user -> ResponseEntity.ok(Map.of(
                                                "success", true,
                                                "user", user)))
                                .orElse(ResponseEntity.badRequest().body(Map.of(
                                                "success", false,
                                                "message", "職員番号またはパスワードが正しくありません")));
        }

        @GetMapping("/user/{id}")
        public ResponseEntity<?> getUser(@PathVariable Long id) {
                return authService.getUserById(id)
                                .map(ResponseEntity::ok)
                                .orElse(ResponseEntity.notFound().build());
        }

        @PostMapping("/change-password")
        public ResponseEntity<?> changePassword(@RequestBody Map<String, Object> request) {
                try {
                        Long userId = Long.valueOf(request.get("userId").toString());
                        String newPassword = request.get("newPassword").toString();
                        authService.changePassword(userId, newPassword);
                        return ResponseEntity.ok(Map.of("success", true));
                } catch (Exception e) {
                        return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
                }
        }

        @PostMapping("/setup")
        public ResponseEntity<?> setupAccount(@RequestBody Map<String, Object> request) {
                try {
                        String token = request.get("token").toString();
                        String password = request.get("password").toString();
                        UserDto user = authService.setupAccount(token, password);
                        return ResponseEntity.ok(Map.of("success", true, "user", user));
                } catch (Exception e) {
                        return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
                }
        }
}
