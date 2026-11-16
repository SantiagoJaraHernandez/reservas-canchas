package com.reservas.ms_reservas.exception;

public class ReservaNotFoundException extends RuntimeException {

    private final Long id;

    public ReservaNotFoundException(Long id) {
        super("Reserva no encontrada con id: " + id);
        this.id = id;
    }

    public Long getId() {
        return id;
    }
}