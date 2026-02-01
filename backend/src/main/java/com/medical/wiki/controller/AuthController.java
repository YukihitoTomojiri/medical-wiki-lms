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
}
