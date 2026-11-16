package com.reservas.gateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * HARDENING:
 *  - Ya no existe un secreto por defecto quemado en el codigo: si JWT_SECRET no
 *    se define (o es corto) el gateway NO arranca (fail-fast).
 *  - Se valida firma, expiracion y emisor (iss) del token.
 *  - El token se parsea una sola vez por peticion (parse -> Claims).
 */
@Component
@Slf4j
public class JwtTokenProvider {

    public static final String ISSUER = "reservas-canchas-auth";
    private static final int MIN_SECRET_BYTES = 32;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    private SecretKey signingKey;

    @PostConstruct
    void init() {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET no definido o demasiado corto (minimo " + MIN_SECRET_BYTES + " bytes)");
        }
        signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Devuelve los claims si el token es valido, o null si no lo es.
     */
    public Claims parse(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .requireIssuer(ISSUER)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            // No se registra el token, solo el motivo.
            log.warn("Token rechazado: {}", e.getClass().getSimpleName());
            return null;
        }
    }
}
