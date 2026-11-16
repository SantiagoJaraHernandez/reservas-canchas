package com.reservas.ms_auth.exception;

public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String email) {
        super("El email ya esta registrado: " + email);
    }
}