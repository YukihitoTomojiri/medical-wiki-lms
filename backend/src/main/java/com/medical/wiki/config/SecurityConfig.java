package com.medical.wiki.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
public class SecurityConfig {

    private final UserHeaderFilter userHeaderFilter;

    public SecurityConfig(UserHeaderFilter userHeaderFilter) {
        this.userHeaderFilter = userHeaderFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/users/me/**").authenticated()
                        .requestMatchers("/api/users/**").hasAnyRole("ADMIN", "DEVELOPER")
                        .requestMatchers("/api/facilities/**").hasAnyRole("ADMIN", "DEVELOPER")
                        .requestMatchers("/api/departments/**").hasAnyRole("ADMIN", "DEVELOPER")
                        .requestMatchers("/api/departments/**").hasAnyRole("ADMIN", "DEVELOPER")
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "DEVELOPER")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/training/events/**")
                        .hasAnyRole("ADMIN", "DEVELOPER")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/training/events/**")
                        .hasAnyRole("ADMIN", "DEVELOPER")
                        .requestMatchers("/api/training/events/admin/**").hasAnyRole("ADMIN", "DEVELOPER")
                        .requestMatchers("/api/training/responses/**").authenticated() // Allow all authenticated users
                                                                                       // to submit/view own responses
                        .requestMatchers("/api/training/**").authenticated() // General training access
                        .anyRequest().permitAll())
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .addFilterBefore(userHeaderFilter,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
