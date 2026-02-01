package com.medical.wiki;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
public class AdminApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "DEVELOPER")
    public void developerCanAccessAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/system"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void adminCannotAccessAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/system"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "USER")
    public void userCannotAccessAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/system"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void anonymousCannotAccessAdminApi() throws Exception {
        mockMvc.perform(get("/api/admin/system"))
                .andExpect(status().isForbidden());
    }
}
