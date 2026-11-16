package com.reservas.gateway.config;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * HARDENING del filtro de autenticacion:
 *  1. Elimina SIEMPRE los headers de identidad que mande el cliente
 *     (X-User-Id, X-User-Email, X-User-Role, X-Internal-Token). Antes un atacante
 *     podia enviar "X-User-Role: ADMIN" y suplantar identidades.
 *  2. Rutas publicas por coincidencia EXACTA (antes era startsWith, lo que
 *     dejaba publico todo lo que empezara por /actuator o /auth/register...).
 *  3. /auth/register-admin deja de ser publica.
 *  4. Solo se acepta rol USER o ADMIN dentro del token.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter implements WebFilter {

    static final Set<String> IDENTITY_HEADERS = Set.of(
            "X-User-Id", "X-User-Email", "X-User-Role", "X-Internal-Token");

    private static final Set<String> PUBLIC_POST = Set.of("/auth/login", "/auth/register");
    private static final Set<String> PUBLIC_GET = Set.of("/canchas", "/canchas/activas", "/actuator/health");
    private static final Pattern PUBLIC_GET_CANCHA = Pattern.compile("^/canchas/\\d{1,10}$");
    private static final Set<String> VALID_ROLES = Set.of("USER", "ADMIN");

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // 1) Limpiar headers de identidad enviados por el cliente
        ServerHttpRequest cleaned = exchange.getRequest().mutate()
                .headers(h -> IDENTITY_HEADERS.forEach(h::remove))
                .build();
        ServerWebExchange cleanExchange = exchange.mutate().request(cleaned).build();

        String path = cleaned.getPath().pathWithinApplication().value();
        HttpMethod method = cleaned.getMethod();

        if (HttpMethod.OPTIONS.equals(method) || isPublicRoute(path, method)) {
            return chain.filter(cleanExchange);
        }

        String token = extractToken(cleaned);
        Claims claims = token != null ? jwtTokenProvider.parse(token) : null;

        if (claims == null) {
            log.warn("Acceso no autenticado a {} {}", method, path);
            return reject(cleanExchange, HttpStatus.UNAUTHORIZED, "No autenticado");
        }

        String email = claims.getSubject();
        Object roleClaim = claims.get("role");
        Object userIdClaim = claims.get("userId");
        String role = roleClaim != null ? roleClaim.toString() : "";
        String userId = userIdClaim != null ? userIdClaim.toString() : "";

        if (email == null || userId.isBlank() || !VALID_ROLES.contains(role)) {
            return reject(cleanExchange, HttpStatus.UNAUTHORIZED, "Token invalido");
        }

        ServerHttpRequest authenticated = cleaned.mutate()
                .header("X-User-Email", email)
                .header("X-User-Id", userId)
                .header("X-User-Role", role)
                .build();

        return chain.filter(cleanExchange.mutate().request(authenticated).build());
    }

    private String extractToken(ServerHttpRequest request) {
        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ") && authHeader.length() < 4096) {
            return authHeader.substring(7).trim();
        }
        return null;
    }

    static boolean isPublicRoute(String path, HttpMethod method) {
        if (HttpMethod.POST.equals(method)) {
            return PUBLIC_POST.contains(path);
        }
        if (HttpMethod.GET.equals(method)) {
            return PUBLIC_GET.contains(path) || PUBLIC_GET_CANCHA.matcher(path).matches();
        }
        return false;
    }

    static Mono<Void> reject(ServerWebExchange exchange, HttpStatus status, String message) {
        var response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body = ("{\"message\":\"" + message + "\"}").getBytes(StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body)));
    }
}
