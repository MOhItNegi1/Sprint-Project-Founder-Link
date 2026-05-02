package com.example.investmentService.exception;

public class InvalidStartupStateException extends RuntimeException {
    public InvalidStartupStateException(String message) {
        super(message);
    }
}
