package com.reservas.ms_reservas.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.reservas.ms_reservas.model.Reserva;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ReservaDTO {

    private Long id;

    private String idUsuario;

    @NotNull(message = "El id de la cancha es requerido")
    private Long idCancha;

    @NotNull(message = "La fecha es requerida")
    private LocalDate fecha;

    @NotNull(message = "La hora de inicio es requerida")
    private LocalTime horaInicio;

    @NotNull(message = "La hora de fin es requerida")
    private LocalTime horaFin;

    private String estado;

    private LocalDateTime fechaCreacion;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(String idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Long getIdCancha() {
        return idCancha;
    }

    public void setIdCancha(Long idCancha) {
        this.idCancha = idCancha;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(LocalTime horaInicio) {
        this.horaInicio = horaInicio;
    }

    public LocalTime getHoraFin() {
        return horaFin;
    }

    public void setHoraFin(LocalTime horaFin) {
        this.horaFin = horaFin;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public static ReservaDTO fromEntity(Reserva r) {
        ReservaDTO dto = new ReservaDTO();
        dto.setId(r.getId());
        dto.setIdUsuario(r.getIdUsuario());
        dto.setIdCancha(r.getIdCancha());
        dto.setFecha(r.getFecha());
        dto.setHoraInicio(r.getHoraInicio());
        dto.setHoraFin(r.getHoraFin());
        dto.setEstado(r.getEstado());
        dto.setFechaCreacion(r.getFechaCreacion());
        return dto;
    }

    public Reserva toEntity() {
        Reserva r = new Reserva();
        r.setId(this.id);
        r.setIdUsuario(this.idUsuario);
        r.setIdCancha(this.idCancha);
        r.setFecha(this.fecha);
        r.setHoraInicio(this.horaInicio);
        r.setHoraFin(this.horaFin);
        r.setEstado(this.estado);
        r.setFechaCreacion(this.fechaCreacion);
        return r;
    }
}