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
