package com.medical.wiki.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailService {
    public void sendPasswordResetEmail(String to, String token) {
        // In a real application, this would use JavaMailSender
        // For this local environment, we log the link to the console
        String resetUrl = "http://localhost:5173/reset-password?token=" + token;
        log.info("=========== PASSWORD RESET EMAIL ===========");
        log.info("To: {}", to);
        log.info("Subject: Password Reset Request");
        log.info("Body: Click the link below to reset your password:");
        log.info("Link: {}", resetUrl);
        log.info("============================================");

        // Also simpler log for easy grep
        System.out.println("RESET_LINK: " + resetUrl);
    }
}
