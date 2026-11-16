package com.reservas.ms_reservas.controller;

import com.reservas.ms_reservas.dto.ReservaDTO;
import com.reservas.ms_reservas.model.Reserva;
import com.reservas.ms_reservas.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/reservas")
@RequiredArgsConstructor
@Slf4j
public class ReservaController {

    private final ReservaService reservaService;

    private static final String ADMIN_ROLE = "ADMIN";

    @GetMapping
    public ResponseEntity<List<ReservaDTO>> listar(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        log.info("GET /reservas - User: {}, Role: {}", userId, role);

        if (ADMIN_ROLE.equals(role)) {
            List<ReservaDTO> reservas = reservaService.listar().stream()
                    .map(ReservaDTO::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(reservas);
        }

        if (userId != null && !userId.isBlank()) {
            List<ReservaDTO> reservas = reservaService.listarPorUsuario(userId).stream()
                    .map(ReservaDTO::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(reservas);
        }

        log.warn("Unauthorized access attempt to list reservas");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservaDTO> obtener(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        log.info("GET /reservas/{} - User: {}, Role: {}", id, userId, role);

        Reserva reserva = reservaService.obtener(id);

        if (ADMIN_ROLE.equals(role)) {
            return ResponseEntity.ok(ReservaDTO.fromEntity(reserva));
        }

        if (userId != null && userId.equals(reserva.getIdUsuario())) {
            return ResponseEntity.ok(ReservaDTO.fromEntity(reserva));
        }

        log.warn("User {} attempted to access reserva {} of another user", userId, id);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PostMapping
    public ResponseEntity<ReservaDTO> crear(
            @Valid @RequestBody ReservaDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {

        log.info("POST /reservas - User: {}, Cancha: {}", userId, dto.getIdCancha());

        if (userId == null || userId.isBlank()) {
            log.warn("Unauthorized attempt to create reserva");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (dto.getFecha().isBefore(LocalDate.now()) || dto.getFecha().isAfter(LocalDate.now().plusYears(1))) {
            throw new IllegalArgumentException("La fecha debe estar entre hoy y un ano adelante");
        }
        validarHorario(dto);

        dto.setIdUsuario(userId);
        Reserva guardada = reservaService.crear(dto.toEntity());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ReservaDTO.fromEntity(guardada));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReservaDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ReservaDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        log.info("PUT /reservas/{} - User: {}, Role: {}", id, userId, role);

        Reserva reserva = reservaService.obtener(id);

        if (!ADMIN_ROLE.equals(role) && (userId == null || !userId.equals(reserva.getIdUsuario()))) {
            log.warn("User {} attempted to update reserva {} of another user", userId, id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        validarHorario(dto);
        dto.setIdUsuario(reserva.getIdUsuario());
        Reserva actualizada = reservaService.actualizar(id, dto.toEntity());

        return ResponseEntity.ok(ReservaDTO.fromEntity(actualizada));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        log.info("DELETE /reservas/{} - User: {}, Role: {}", id, userId, role);

        Reserva reserva = reservaService.obtener(id);

        if (!ADMIN_ROLE.equals(role) && (userId == null || !userId.equals(reserva.getIdUsuario()))) {
            log.warn("User {} attempted to delete reserva {} of another user", userId, id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        reservaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    /** HARDENING: validacion de reglas de negocio en el servidor. */
    private void validarHorario(ReservaDTO dto) {
        if (!dto.getHoraInicio().isBefore(dto.getHoraFin())) {
            throw new IllegalArgumentException("La hora de inicio debe ser anterior a la hora de fin");
        }
    }
}
