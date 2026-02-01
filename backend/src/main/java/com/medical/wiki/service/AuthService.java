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

    public Optional<UserDto> authenticate(LoginRequest request) {
        return userRepository.findByEmployeeId(request.getEmployeeId())
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .map(user -> {
                    loggingService.log("LOGIN", user.getName(), "Successful login", user.getEmployeeId());
                    return UserDto.fromEntity(user);
                });
    }


    public Optional<UserDto> getUserById(Long id) {
        return userRepository.findById(id).map(UserDto::fromEntity);
    }
}
