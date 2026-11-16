package com.reservas.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

import java.util.Arrays;

/**
 * HARDENING CORS: origenes tomados solo de la variable CORS_ORIGINS (sin
 * comodines), metodos y cabeceras explicitas en lugar de "*".
 * En el despliegue el frontend y la API comparten origen (nginx /api), asi que
 * CORS normalmente ni se usa.
 */
@Configuration
public class WebFluxConfiguration implements WebFluxConfigurer {

    @Value("${cors.allowed-origins:}")
    private String corsOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = Arrays.stream(corsOrigins.split(","))
                .map(String::trim)
                .filter(o -> !o.isEmpty() && !o.contains("*"))
                .toArray(String[]::new);
        if (origins.length == 0) {
            return;
        }
        registry.addMapping("/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
