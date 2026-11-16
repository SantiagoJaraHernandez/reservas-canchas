package com.reservas.ms_auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateUserRoleRequest {
    @NotBlank(message = "El rol es obligatorio")
    private String rol;
}
