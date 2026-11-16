package com.reservas.gateway.config;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * HARDENING: cabeceras de seguridad en todas las respuestas de la API.
 * Las respuestas de la API son JSON, por eso la CSP es la mas restrictiva.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeadersFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        exchange.getResponse().beforeCommit(() -> {
            HttpHeaders h = exchange.getResponse().getHeaders();
            h.set("X-Content-Type-Options", "nosniff");
            h.set("X-Frame-Options", "DENY");
            h.set("Referrer-Policy", "no-referrer");
            h.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
            h.set("Cache-Control", "no-store");
            h.set("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
            return Mono.empty();
        });
        return chain.filter(exchange);
    }
}
