package com.medical.wiki.config;

import com.medical.wiki.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class UserHeaderFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String userIdStr = request.getHeader("X-User-Id");

        if (userIdStr != null && !userIdStr.isEmpty()) {
            try {
                Long userId = Long.parseLong(userIdStr);
                userRepository.findById(userId).ifPresent(user -> {
                    try {
                        String role = "ROLE_" + user.getRole().name();
                        UserPrincipal principal = new UserPrincipal(
                                user.getId(),
                                user.getEmployeeId(),
                                user.getPassword(),
                                Collections.singletonList(new SimpleGrantedAuthority(role)));
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                principal, null, principal.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        log.debug("Authenticated user: {} with role: {}", user.getEmployeeId(), role);
                    } catch (Exception e) {
                        log.error("Error setting authentication for user {}: {}", userId, e.getMessage(), e);
                    }
                });
            } catch (NumberFormatException e) {
                log.warn("Invalid X-User-Id format: {}", userIdStr);
            } catch (Exception e) {
                log.error("Error in UserHeaderFilter: {}", e.getMessage(), e);
            }
        }

        filterChain.doFilter(request, response);
    }
}
