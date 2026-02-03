package com.medical.wiki.config;

import com.medical.wiki.entity.User;
import com.medical.wiki.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserActivityInterceptor implements HandlerInterceptor {

    private final UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !"anonymousUser".equals(authentication.getPrincipal())) {

            try {
                String employeeId = null;
                if (authentication.getPrincipal() instanceof UserDetails) {
                    employeeId = ((UserDetails) authentication.getPrincipal()).getUsername();
                } else if (authentication.getPrincipal() instanceof String) {
                    employeeId = (String) authentication.getPrincipal();
                }

                if (employeeId != null) {
                    // Optimized: Only update if strictly necessary or use async event in production
                    // For MVP/Demo: Direct update is acceptable but potentially heavy on high load
                    // Using SQL directly could be faster: "UPDATE users SET last_seen_at = NOW()
                    // WHERE ..."
                    // For now, assume JPA overhead is acceptable for this scale
                    userRepository.findByEmployeeId(employeeId).ifPresent(user -> {
                        // Debounce: Update only if > 5 minutes since last update to reduce DB writes
                        if (user.getLastSeenAt() == null ||
                                user.getLastSeenAt().isBefore(LocalDateTime.now().minusMinutes(5))) {
                            user.setLastSeenAt(LocalDateTime.now());
                            userRepository.save(user);
                        }
                    });
                }
            } catch (Exception e) {
                // Don't block request if activity tracking fails
                log.warn("Failed to update user activity: {}", e.getMessage());
            }
        }
        return true;
    }
}
