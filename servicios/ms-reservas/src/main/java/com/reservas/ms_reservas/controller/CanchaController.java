package com.reservas.ms_reservas.controller;

import com.reservas.ms_reservas.dto.CanchaDTO;
import com.reservas.ms_reservas.model.Cancha;
import com.reservas.ms_reservas.service.CanchaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/canchas")
@RequiredArgsConstructor
@Slf4j
public class CanchaController {

    private final CanchaService canchaService;

    private static final String ADMIN_ROLE = "ADMIN";

    @GetMapping
    public ResponseEntity<List<CanchaDTO>> listar() {
        log.info("GET /canchas - Listing all canchas");
        List<CanchaDTO> canchas = canchaService.listar().stream()
                .map(CanchaDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(canchas);
    }

    @GetMapping("/activas")
    public ResponseEntity<List<CanchaDTO>> listarActivas() {
        log.info("GET /canchas/activas - Listing active canchas only");
        List<CanchaDTO> canchas = canchaService.listarActivas().stream()
                .map(CanchaDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(canchas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CanchaDTO> obtener(@PathVariable Long id) {
        log.info("GET /canchas/{} - Getting cancha details", id);
        Cancha cancha = canchaService.obtener(id);
        return ResponseEntity.ok(CanchaDTO.fromEntity(cancha));
    }

    @PostMapping
    public ResponseEntity<CanchaDTO> crear(
            @Valid @RequestBody CanchaDTO dto,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        
        if (!ADMIN_ROLE.equals(role)) {
            log.warn("Unauthorized attempt to create cancha. Role: {}", role);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        log.info("POST /canchas - Creating new cancha: {}", dto.getNombre());
        Cancha cancha = dto.toEntity();
        Cancha creada = canchaService.crear(cancha);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(CanchaDTO.fromEntity(creada));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CanchaDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CanchaDTO dto,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        
        if (!ADMIN_ROLE.equals(role)) {
            log.warn("Unauthorized attempt to update cancha. Role: {}", role);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        log.info("PUT /canchas/{} - Updating cancha", id);
        Cancha cancha = dto.toEntity();
        Cancha actualizada = canchaService.actualizar(id, cancha);
        return ResponseEntity.ok(CanchaDTO.fromEntity(actualizada));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        
        if (!ADMIN_ROLE.equals(role)) {
            log.warn("Unauthorized attempt to delete cancha. Role: {}", role);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        log.info("DELETE /canchas/{} - Deleting cancha", id);
        canchaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<Void> desactivar(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        
        if (!ADMIN_ROLE.equals(role)) {
            log.warn("Unauthorized attempt to deactivate cancha. Role: {}", role);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        log.info("PATCH /canchas/{}/desactivar - Deactivating cancha", id);
        canchaService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
