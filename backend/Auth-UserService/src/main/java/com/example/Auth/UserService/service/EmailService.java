package com.example.Auth.UserService.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    public void sendWelcomeEmail(String toEmail, String name) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Welcome to FounderLink");
        message.setText(buildWelcomeMessage(name));
        mailSender.send(message);
    }

    private String buildWelcomeMessage(String name) {
        return "Hi " + name + ",\n\n"
                + "Welcome to FounderLink.\n"
                + "Your account has been created successfully.\n\n"
                + "We're glad to have you on board.\n\n"
                + "Team FounderLink";
    }
}
