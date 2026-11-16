package com.reservas.ms_auth.config;

import com.reservas.ms_auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * HARDENING: el primer administrador ya no se crea por un endpoint publico,
 * sino al arrancar, a partir de variables de entorno (ADMIN_EMAIL /
 * ADMIN_PASSWORD) que solo conoce quien despliega. Si ya existe, no hace nada.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements ApplicationRunner {

    private final AuthService authService;

    @Value("${bootstrap.admin.email:}")
    private String adminEmail;

    @Value("${bootstrap.admin.password:}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            log.info("Bootstrap de administrador omitido (ADMIN_EMAIL/ADMIN_PASSWORD no definidos)");
            return;
        }
        if (adminPassword.length() < 12) {
            log.error("ADMIN_PASSWORD debe tener al menos 12 caracteres; no se crea el administrador");
            return;
        }
        authService.createUserIfMissing("Administrador", adminEmail, adminPassword, "ADMIN");
        log.info("Administrador inicial verificado");
    }
}
