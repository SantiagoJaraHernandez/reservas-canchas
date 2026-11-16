package com.reservas.ms_auth.controller;

import com.reservas.ms_auth.dto.UpdateUserRoleRequest;
import com.reservas.ms_auth.dto.UserResponse;
import com.reservas.ms_auth.model.User;
import com.reservas.ms_auth.service.UserAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UserController {

    private static final String ADMIN_ROLE = "ADMIN";
    private final UserAdminService userAdminService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> listar(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!ADMIN_ROLE.equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(userAdminService.listar().stream().map(UserResponse::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> obtener(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!ADMIN_ROLE.equals(role) && !id.equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(UserResponse.fromEntity(userAdminService.obtener(id)));
    }

    @PutMapping("/{id}/rol")
    public ResponseEntity<UserResponse> actualizarRol(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!ADMIN_ROLE.equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        User user = userAdminService.actualizarRol(id, request.getRol());
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }
}
