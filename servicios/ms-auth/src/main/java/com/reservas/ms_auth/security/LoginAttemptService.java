package com.reservas.ms_auth.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * HARDENING: bloqueo temporal de cuenta tras N intentos fallidos de login
 * (por defecto 5 intentos -> 15 minutos). Mitiga fuerza bruta y
 * credential stuffing contra una cuenta concreta.
 */
@Service
public class LoginAttemptService {

    private final int maxAttempts;
    private final Duration lockDuration;
    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    public LoginAttemptService(@Value("${security.login.max-attempts:5}") int maxAttempts,
                               @Value("${security.login.lock-minutes:15}") long lockMinutes) {
        this.maxAttempts = maxAttempts;
        this.lockDuration = Duration.ofMinutes(lockMinutes);
    }

    public boolean isBlocked(String email) {
        Attempt a = attempts.get(key(email));
        if (a == null || a.lockedUntil == null) return false;
        if (Instant.now().isAfter(a.lockedUntil)) {
            attempts.remove(key(email));
            return false;
        }
        return true;
    }

    public void loginFailed(String email) {
        attempts.compute(key(email), (k, a) -> {
            Attempt n = a == null ? new Attempt() : a;
            n.failures++;
            if (n.failures >= maxAttempts) {
                n.lockedUntil = Instant.now().plus(lockDuration);
            }
            return n;
        });
    }

    public void loginSucceeded(String email) {
        attempts.remove(key(email));
    }

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private static final class Attempt {
        int failures;
        Instant lockedUntil;
    }
}
