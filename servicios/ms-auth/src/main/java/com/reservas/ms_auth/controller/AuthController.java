package com.reservas.ms_auth.controller;

import com.reservas.ms_auth.dto.LoginRequest;
import com.reservas.ms_auth.dto.LoginResponse;
import com.reservas.ms_auth.dto.RegisterRequest;
import com.reservas.ms_auth.dto.RegisterResponse;
import com.reservas.ms_auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private static final String ADMIN_ROLE = "ADMIN";
    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    /**
     * HARDENING (vulnerabilidad critica corregida): antes este endpoint era
     * publico y cualquiera podia crearse una cuenta ADMIN. Ahora solo un
     * ADMIN autenticado puede crear otro administrador.
     */
    @PostMapping("/register-admin")
    public ResponseEntity<RegisterResponse> registerAdmin(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!ADMIN_ROLE.equals(role)) {
            log.warn("AUDIT intento de crear ADMIN sin permisos userId={}", userId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        log.info("AUDIT ADMIN {} crea un nuevo administrador", userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerAdmin(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
