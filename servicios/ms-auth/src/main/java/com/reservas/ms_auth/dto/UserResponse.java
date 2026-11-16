package com.reservas.ms_auth.dto;

import com.reservas.ms_auth.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String nombre;
    private String email;
    private String rol;
    private LocalDateTime fechaCreacion;

    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getNombre(),
                user.getEmail(),
                user.getRol(),
                user.getFechaCreacion()
        );
    }
}
