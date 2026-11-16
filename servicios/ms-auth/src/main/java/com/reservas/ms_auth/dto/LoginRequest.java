package com.reservas.ms_auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email no tiene formato valido")
    @Size(max = 120)
    private String email;

    @NotBlank(message = "La contrasena es obligatoria")
    @Size(max = 72)
    private String password;
}
