package com.reservas.ms_reservas.exception;

import java.time.LocalDate;
import java.time.LocalTime;

public class CanchaOcupadaException extends RuntimeException {

    private final Long idCancha;

    public CanchaOcupadaException(Long idCancha, LocalDate fecha,
                                   LocalTime inicio, LocalTime fin) {
        super(String.format(
            "La cancha %d ya esta reservada el %s de %s a %s",
            idCancha, fecha, inicio, fin
        ));
        this.idCancha = idCancha;
    }

    public Long getIdCancha() {
        return idCancha;
    }
}