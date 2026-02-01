package com.medical.wiki.service;

import com.medical.wiki.dto.*;
import com.medical.wiki.entity.*;
import com.medical.wiki.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoggingService loggingService;
    private final SecurityAnomalyService securityAnomalyService;
    private final EmailService emailService;

    @org.springframework.transaction.annotation.Transactional
    public void changePassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);
        loggingService.log("PASSWORD_CHANGE", user.getName(), "Password changed", user.getEmployeeId());
    }

    @org.springframework.transaction.annotation.Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = java.util.UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(java.time.LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            emailService.sendPasswordResetEmail(email, token);
            loggingService.log("PASSWORD_RESET_REQUEST", user.getName(), "Reset requested", user.getEmployeeId());
        });
    }

    @org.springframework.transaction.annotation.Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .filter(u -> u.getResetTokenExpiry().isAfter(java.time.LocalDateTime.now()))
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        user.setMustChangePassword(false);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        loggingService.log("PASSWORD_RESET_COMPLETE", user.getName(), "Password reset via token", user.getEmployeeId());
    }

    @org.springframework.transaction.annotation.Transactional
    public String adminResetPassword(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String tempPassword = java.util.UUID.randomUUID().toString().substring(0, 8);
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        loggingService.log("ADMIN_PASSWORD_RESET", "ADMIN", "Reset password for " + user.getName(),
                user.getEmployeeId());
        return tempPassword;
    }

    @org.springframework.transaction.annotation.Transactional
    public UserDto setupAccount(String token, String password) {
        User user = userRepository.findByInvitationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired invitation token"));

        user.setPassword(passwordEncoder.encode(password));
        user.setMustChangePassword(false);
        user.setInvitationToken(null);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        loggingService.log("ACCOUNT_SETUP", user.getName(), "Account setup via invitation", user.getEmployeeId());
        return UserDto.fromEntity(user);
    }

    public Optional<UserDto> authenticate(LoginRequest request, String ipAddress) {
        Optional<User> userOpt = userRepository.findByEmployeeId(request.getEmployeeId());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                loggingService.log("LOGIN", user.getName(), "Successful login", user.getEmployeeId());
                return Optional.of(UserDto.fromEntity(user));
            }
        }

        // Login failed or user not found
        loggingService.log("LOGIN_FAILURE", "Auth", "Failed login attempt", request.getEmployeeId());
        securityAnomalyService.checkLoginFailure(request.getEmployeeId(), ipAddress);
        return Optional.empty();
    }

    public Optional<UserDto> getUserById(Long id) {
        return userRepository.findById(id).map(UserDto::fromEntity);
    }
}
