package com.reservas.ms_auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String tipo;
    private long expiresIn;
    private String email;
    private String rol;
}