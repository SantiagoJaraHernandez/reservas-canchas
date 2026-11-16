package com.reservas.gateway;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.regex.Pattern;

/**
 * Gateway: punto unico de entrada.
 *
 * HARDENING aplicado en esta clase:
 *  - Se elimino el @CrossOrigin con origenes quemados (CORS solo por configuracion).
 *  - Los IDs de ruta se validan con lista blanca (numericos o ObjectId de Mongo)
 *    antes de construir la URL interna -> evita path traversal / SSRF interno.
 *  - Cada llamada interna lleva X-Internal-Token: los microservicios rechazan
 *    cualquier peticion que no venga del gateway.
 *  - Los errores inesperados no filtran detalles internos al cliente.
 *  - /auth/register-admin ahora exige JWT (el control de rol ADMIN lo hace ms-auth).
 */
@RestController
@RequestMapping
@RequiredArgsConstructor
@Slf4j
public class GatewayController {

    private static final Pattern MONGO_ID = Pattern.compile("^[a-fA-F0-9]{24}$");
    private static final Pattern ESTADO = Pattern.compile("^[A-Z_]{1,20}$");

    private final WebClient webClient;

    @Value("${ms-reservas.base-url}")
    private String msReservasUrl;

    @Value("${ms-auth.base-url}")
    private String msAuthUrl;

    @Value("${ms-pagos.base-url:http://ms-pagos:8083}")
    private String msPagosUrl;

    @Value("${internal.token:}")
    private String internalToken;

    @PostConstruct
    void checkConfig() {
        if (internalToken == null || internalToken.length() < 32) {
            throw new IllegalStateException("INTERNAL_TOKEN no definido o demasiado corto (minimo 32 caracteres)");
        }
    }

    // ---------------------------------------------------------------- AUTH
    @PostMapping("/auth/register")
    public Mono<ResponseEntity<String>> register(@RequestBody String body, ServerWebExchange ex) {
        return proxy(HttpMethod.POST, msAuthUrl + "/auth/register", body, ex);
    }

    @PostMapping("/auth/register-admin")
    public Mono<ResponseEntity<String>> registerAdmin(@RequestBody String body, ServerWebExchange ex) {
        return proxy(HttpMethod.POST, msAuthUrl + "/auth/register-admin", body, ex);
    }

    @PostMapping("/auth/login")
    public Mono<ResponseEntity<String>> login(@RequestBody String body, ServerWebExchange ex) {
        return proxy(HttpMethod.POST, msAuthUrl + "/auth/login", body, ex);
    }

    // ------------------------------------------------------------ USUARIOS
    @GetMapping("/usuarios")
    public Mono<ResponseEntity<String>> listarUsuarios(ServerWebExchange ex) {
        return proxy(HttpMethod.GET, msAuthUrl + "/usuarios", null, ex);
    }

    @GetMapping("/usuarios/{id}")
    public Mono<ResponseEntity<String>> obtenerUsuario(@PathVariable String id, ServerWebExchange ex) {
        if (!MONGO_ID.matcher(id).matches()) return badRequest("Id de usuario invalido");
        return proxy(HttpMethod.GET, msAuthUrl + "/usuarios/" + id, null, ex);
    }

    @PutMapping("/usuarios/{id}/rol")
    public Mono<ResponseEntity<String>> actualizarRolUsuario(@PathVariable String id,
                                                             @RequestBody String body,
                                                             ServerWebExchange ex) {
        if (!MONGO_ID.matcher(id).matches()) return badRequest("Id de usuario invalido");
        return proxy(HttpMethod.PUT, msAuthUrl + "/usuarios/" + id + "/rol", body, ex);
    }

    // ------------------------------------------------------------ RESERVAS
    @GetMapping("/reservas")
    public Mono<ResponseEntity<String>> listarReservas(ServerWebExchange ex) {
        return proxy(HttpMethod.GET, msReservasUrl + "/reservas", null, ex);
    }

    @GetMapping("/reservas/{id}")
    public Mono<ResponseEntity<String>> obtenerReserva(@PathVariable Long id, ServerWebExchange ex) {
        return proxy(HttpMethod.GET, msReservasUrl + "/reservas/" + id, null, ex);
    }

    @PostMapping("/reservas")
    public Mono<ResponseEntity<String>> crearReserva(@RequestBody String body, ServerWebExchange ex) {
        return proxy(HttpMethod.POST, msReservasUrl + "/reservas", body, ex);
    }

    @PutMapping("/reservas/{id}")
    public Mono<ResponseEntity<String>> actualizarReserva(@PathVariable Long id,
                                                          @RequestBody String body,
                                                          ServerWebExchange ex) {
        return proxy(HttpMethod.PUT, msReservasUrl + "/reservas/" + id, body, ex);
    }

    @DeleteMapping("/reservas/{id}")
    public Mono<ResponseEntity<String>> eliminarReserva(@PathVariable Long id, ServerWebExchange ex) {
        return proxy(HttpMethod.DELETE, msReservasUrl + "/reservas/" + id, null, ex);
    }

    // ------------------------------------------------------------- CANCHAS
    @GetMapping("/canchas")
    public Mono<ResponseEntity<String>> listarCanchas(ServerWebExchange ex) {
        return proxy(HttpMethod.GET, msReservasUrl + "/canchas", null, ex);
    }

    @GetMapping("/canchas/activas")
    public Mono<ResponseEntity<String>> listarCanchasActivas(ServerWebExchange ex) {
        return proxy(HttpMethod.GET, msReservasUrl + "/canchas/activas", null, ex);
    }

    @GetMapping("/canchas/{id}")
    public Mono<ResponseEntity<String>> obtenerCancha(@PathVariable Long id, ServerWebExchange ex) {
        return proxy(HttpMethod.GET, msReservasUrl + "/canchas/" + id, null, ex);
    }

    @PostMapping("/canchas")
    public Mono<ResponseEntity<String>> crearCancha(@RequestBody String body, ServerWebExchange ex) {
        return proxy(HttpMethod.POST, msReservasUrl + "/canchas", body, ex);
    }

    @PutMapping("/canchas/{id}")
    public Mono<ResponseEntity<String>> actualizarCancha(@PathVariable Long id,
                                                         @RequestBody String body,
                                                         ServerWebExchange ex) {
        return proxy(HttpMethod.PUT, msReservasUrl + "/canchas/" + id, body, ex);
    }

    @DeleteMapping("/canchas/{id}")
    public Mono<ResponseEntity<String>> eliminarCancha(@PathVariable Long id, ServerWebExchange ex) {
        return proxy(HttpMethod.DELETE, msReservasUrl + "/canchas/" + id, null, ex);
    }

    // --------------------------------------------- PAGOS (servicio futuro)
    @GetMapping("/pagos")
    public Mono<ResponseEntity<String>> listarPagos(ServerWebExchange ex) {
        return proxy(HttpMethod.GET, msPagosUrl + "/pagos", null, ex);
    }

    @GetMapping("/pagos/{id}")
    public Mono<ResponseEntity<String>> obtenerPago(@PathVariable String id, ServerWebExchange ex) {
        if (!MONGO_ID.matcher(id).matches()) return badRequest("Id de pago invalido");
        return proxy(HttpMethod.GET, msPagosUrl + "/pagos/" + id, null, ex);
    }

    @GetMapping("/pagos/reserva/{idReserva}")
    public Mono<ResponseEntity<String>> listarPagosPorReserva(@PathVariable Long idReserva, ServerWebExchange ex) {
        return proxy(HttpMethod.GET, msPagosUrl + "/pagos/reserva/" + idReserva, null, ex);
    }

    @PostMapping("/pagos/simular")
    public Mono<ResponseEntity<String>> simularPago(@RequestBody String body, ServerWebExchange ex) {
        return proxy(HttpMethod.POST, msPagosUrl + "/pagos/simular", body, ex);
    }

    @PatchMapping("/pagos/{id}/estado")
    public Mono<ResponseEntity<String>> cambiarEstadoPago(@PathVariable String id,
                                                          @RequestParam String estado,
                                                          ServerWebExchange ex) {
        if (!MONGO_ID.matcher(id).matches() || !ESTADO.matcher(estado).matches()) {
            return badRequest("Parametros invalidos");
        }
        return proxy(HttpMethod.PATCH, msPagosUrl + "/pagos/" + id + "/estado?estado=" + estado, null, ex);
    }

    // ------------------------------------------------------------- helpers
    private Mono<ResponseEntity<String>> proxy(HttpMethod method, String uri, String body, ServerWebExchange ex) {
        WebClient.RequestBodySpec spec = webClient.method(method)
                .uri(uri)
                .headers(h -> copyAuthHeaders(ex, h));

        WebClient.RequestHeadersSpec<?> request = body != null
                ? spec.contentType(MediaType.APPLICATION_JSON).bodyValue(body)
                : spec;

        return request.retrieve()
                .toEntity(String.class)
                .map(this::sanitize)
                .onErrorResume(this::handleError);
    }

    /** Solo se devuelven al cliente el estado, el content-type y el cuerpo. */
    private ResponseEntity<String> sanitize(ResponseEntity<String> downstream) {
        ResponseEntity.BodyBuilder b = ResponseEntity.status(downstream.getStatusCode());
        MediaType ct = downstream.getHeaders().getContentType();
        if (ct != null) b.contentType(ct);
        return b.body(downstream.getBody());
    }

    private void copyAuthHeaders(ServerWebExchange exchange, HttpHeaders headers) {
        headers.set("X-Internal-Token", internalToken);
        HttpHeaders in = exchange.getRequest().getHeaders();
        for (String name : new String[]{"X-User-Id", "X-User-Email", "X-User-Role"}) {
            String v = in.getFirst(name);
            if (v != null) headers.set(name, v);
        }
    }

    private Mono<ResponseEntity<String>> badRequest(String msg) {
        return Mono.just(ResponseEntity.badRequest().contentType(MediaType.APPLICATION_JSON)
                .body("{\"message\":\"" + msg + "\"}"));
    }

    private Mono<ResponseEntity<String>> handleError(Throwable ex) {
        if (ex instanceof WebClientResponseException wex) {
            log.warn("Error del servicio interno: {}", wex.getStatusCode());
            return Mono.just(ResponseEntity.status(wex.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(wex.getResponseBodyAsString().isEmpty()
                            ? "{\"message\":\"Error " + wex.getStatusCode().value() + "\"}"
                            : wex.getResponseBodyAsString()));
        }
        log.error("Error inesperado en gateway: {}", ex.getClass().getSimpleName());
        return Mono.just(ResponseEntity.status(503).contentType(MediaType.APPLICATION_JSON)
                .body("{\"message\":\"Servicio no disponible\"}"));
    }
}
