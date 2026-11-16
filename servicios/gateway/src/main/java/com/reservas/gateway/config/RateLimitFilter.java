package com.reservas.gateway.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * HARDENING: limite de peticiones por IP (ventana fija de 1 minuto).
 *  - /auth/login y /auth/register: AUTH_RATE_LIMIT por minuto (defecto 10)
 *    -> mitiga fuerza bruta y relleno masivo de cuentas.
 *  - Resto de la API: API_RATE_LIMIT por minuto (defecto 120).
 * Es en memoria (una sola instancia de gateway); nginx aplica otra capa.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@Slf4j
public class RateLimitFilter implements WebFilter {

    private static final Set<String> AUTH_PATHS = Set.of("/auth/login", "/auth/register");
    private static final long WINDOW_MS = 60_000;
    private static final int MAX_TRACKED_KEYS = 50_000;

    private final int authLimit;
    private final int apiLimit;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(@Value("${security.rate-limit.auth:10}") int authLimit,
                           @Value("${security.rate-limit.api:120}") int apiLimit) {
        this.authLimit = authLimit;
        this.apiLimit = apiLimit;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        if (HttpMethod.OPTIONS.equals(request.getMethod())) {
            return chain.filter(exchange);
        }
        String path = request.getPath().pathWithinApplication().value();
        boolean isAuth = AUTH_PATHS.contains(path);
        String ip = clientIp(request);
        String key = (isAuth ? "auth:" : "api:") + ip;
        int limit = isAuth ? authLimit : apiLimit;

        if (windows.size() > MAX_TRACKED_KEYS) {
            long now = System.currentTimeMillis();
            windows.entrySet().removeIf(e -> now - e.getValue().start > WINDOW_MS);
        }

        Window w = windows.compute(key, (k, old) -> {
            long now = System.currentTimeMillis();
            return (old == null || now - old.start > WINDOW_MS) ? new Window(now) : old;
        });

        if (w.count.incrementAndGet() > limit) {
            log.warn("Rate limit superado ip={} path={}", ip, path);
            exchange.getResponse().getHeaders().set("Retry-After", "60");
            return JwtAuthFilter.reject(exchange, HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiadas peticiones, intente mas tarde");
        }
        return chain.filter(exchange);
    }

    /**
     * El gateway solo es alcanzable desde nginx (red interna de Docker), por eso
     * se confia en X-Real-IP, que nginx sobrescribe con la IP real del cliente.
     */
    private String clientIp(ServerHttpRequest request) {
        String realIp = request.getHeaders().getFirst("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && realIp.length() <= 45) {
            return realIp.trim();
        }
        InetSocketAddress remote = request.getRemoteAddress();
        return remote != null && remote.getAddress() != null ? remote.getAddress().getHostAddress() : "unknown";
    }

    private static final class Window {
        final long start;
        final AtomicInteger count = new AtomicInteger();

        Window(long start) {
            this.start = start;
        }
    }
}
