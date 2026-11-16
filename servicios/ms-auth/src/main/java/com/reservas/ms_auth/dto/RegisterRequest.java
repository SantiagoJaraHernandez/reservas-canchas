package com.reservas.ms_auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * HARDENING: politica de contrasenas alineada con el frontend
 * (8-72 caracteres, mayuscula, minuscula, numero y caracter especial; 72 es el
 * limite real de BCrypt) y longitudes maximas en todos los campos.
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 80, message = "El nombre admite maximo 80 caracteres")
    @Pattern(regexp = "^[\\p{L}0-9 .'-]+$", message = "El nombre contiene caracteres no permitidos")
    private String nombre;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email no tiene formato valido")
    @Size(max = 120, message = "El email admite maximo 120 caracteres")
    private String email;

    @NotBlank(message = "La contrasena es obligatoria")
    @Size(min = 8, max = 72, message = "La contrasena debe tener entre 8 y 72 caracteres")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
            message = "La contrasena debe incluir mayuscula, minuscula, numero y caracter especial")
    private String password;
}
