package com.reservas.ms_auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RegisterResponse {
    private String id;
    private String email;
    private String rol;
}