package com.reservas.ms_auth.security;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * HARDENING (defensa en profundidad / zero-trust interno):
 * ms-auth solo acepta peticiones que traigan el header X-Internal-Token que
 * pone el gateway. Asi, aunque alguien alcance el puerto del microservicio,
 * no puede suplantar los headers X-User-Role / X-User-Id.
 * La comparacion es en tiempo constante (MessageDigest.isEqual).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class InternalTokenFilter extends OncePerRequestFilter {

    @Value("${internal.token:}")
    private String internalToken;

    private byte[] expected;

    @PostConstruct
    void init() {
        if (internalToken == null || internalToken.length() < 32) {
            throw new IllegalStateException("INTERNAL_TOKEN no definido o demasiado corto (minimo 32 caracteres)");
        }
        expected = internalToken.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "/actuator/health".equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String received = request.getHeader("X-Internal-Token");
        if (received == null || !MessageDigest.isEqual(expected, received.getBytes(StandardCharsets.UTF_8))) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Acceso denegado\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
