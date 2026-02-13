package com.medical.wiki.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.wiki.dto.UserCreateDto;
import com.medical.wiki.entity.User;
import com.medical.wiki.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class UserControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private UserService userService;

        @Autowired
        private ObjectMapper objectMapper;

        @Test
        @WithMockUser(username = "admin", roles = { "ADMIN" })
        public void registerUser_ShouldReturnBadRequest_WhenRequiredFieldsAreMissing() throws Exception {
                UserCreateDto request = new UserCreateDto(
                                null, null, null, null, null, null, null, null, null);
                // Missing required fields (employeeId, name, etc.)

                mockMvc.perform(post("/api/users/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(username = "admin", roles = { "ADMIN" })
        public void registerUser_ShouldReturn200_WhenValidRequest() throws Exception {
                UserCreateDto request = new UserCreateDto(
                                "1234", "Test User", "password", "Main Hospital", "IT",
                                User.Role.USER, "test@example.com", 10.0, LocalDate.of(2024, 1, 1));

                when(userService.registerUser(any(), any())).thenReturn(com.medical.wiki.dto.UserDto.builder()
                                .id(1L)
                                .employeeId("1234")
                                .name("Test User")
                                .facility("Main Hospital")
                                .department("IT")
                                .role("USER")
                                .email("test@example.com")
                                .paidLeaveDays(10.0)
                                .joinedDate(LocalDate.of(2024, 1, 1))
                                .build());

                mockMvc.perform(post("/api/users/register")
                                .param("executorId", "1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());
        }
}
