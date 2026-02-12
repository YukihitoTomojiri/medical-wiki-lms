package com.medical.wiki.service;

import com.medical.wiki.entity.User;
import com.medical.wiki.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User adminUser;
    private User devUser;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setRole(User.Role.ADMIN);
        adminUser.setFacility("Hospital A");

        devUser = new User();
        devUser.setId(2L);
        devUser.setRole(User.Role.DEVELOPER);
        devUser.setFacility("HQ");
    }

    @Test
    void getAllUsers_ShouldFilterByFacility_WhenAdmin() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(userRepository.findByFacility("Hospital A")).thenReturn(Collections.emptyList());

        userService.getAllUsers(1L, null);

        // Should call findByFacility with admin's facility
        verify(userRepository).findByFacility("Hospital A");
        verify(userRepository, never()).findAll();
    }

    @Test
    void getAllUsers_ShouldFindAll_WhenDeveloperAndNoFacilitySpecified() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(devUser));
        when(userRepository.findAll()).thenReturn(Collections.emptyList());

        userService.getAllUsers(2L, null);

        // Should call findAll for developer
        verify(userRepository).findAll();
        verify(userRepository, never()).findByFacility(any());
    }
}
