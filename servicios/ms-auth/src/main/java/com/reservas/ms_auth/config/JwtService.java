package com.reservas.ms_auth.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * HARDENING:
 *  - Secreto obligatorio desde variable de entorno (minimo 32 bytes, fail-fast).
 *  - Expiracion por defecto de 1 hora (antes 24 h).
 *  - Se agrega emisor (iss) y un identificador unico (jti).
 */
@Service
public class JwtService {

    public static final String ISSUER = "reservas-canchas-auth";

    @Value("${jwt.secret:}")
    private String secret;

    @Value("${jwt.expiration:3600000}")
    private long expiration;

    private SecretKey key;

    @PostConstruct
    void init() {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET no definido o demasiado corto (minimo 32 bytes)");
        }
        key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public long getExpiration() {
        return expiration;
    }

    public String generateToken(String email, String rol, String userId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(email)
                .issuer(ISSUER)
                .id(UUID.randomUUID().toString())
                .claim("role", rol)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration))
                .signWith(key)
                .compact();
    }
}
