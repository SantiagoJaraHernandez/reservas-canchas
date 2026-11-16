package com.reservas.ms_reservas.repository;

import com.reservas.ms_reservas.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    // HARDENING: filtrar en BD en lugar de traer todas las reservas a memoria
    List<Reserva> findByIdUsuario(String idUsuario);

    @Query("""
        SELECT r FROM Reserva r
        WHERE r.idCancha = :idCancha
        AND r.fecha = :fecha
        AND (
            (:horaInicio < r.horaFin AND :horaFin > r.horaInicio)
        )
    """)
    List<Reserva> findSolapadas(
            Long idCancha,
            LocalDate fecha,
            LocalTime horaInicio,
            LocalTime horaFin
    );
}