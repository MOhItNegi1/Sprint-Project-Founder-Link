package com.example.apiGateway.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilTest {
    private static final String SECRET = "mysecretkeymysecretkeymysecretkeymysecretkey";

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", SECRET);
    }

    @Test
    void validateTokenReturnsTrueForSignedToken() {
        String token = Jwts.builder()
                .subject("founder@example.com")
                .claim("role", "ROLE_FOUNDER")
                .issuedAt(new Date())
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();

        assertTrue(jwtUtil.validateToken(token));
        assertEquals("ROLE_FOUNDER", jwtUtil.extractClaims(token).get("role"));
    }

    @Test
    void validateTokenReturnsFalseForInvalidToken() {
        assertFalse(jwtUtil.validateToken("not-a-token"));
    }
}
