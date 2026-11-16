package com.reservas.ms_reservas.service;

import com.reservas.ms_reservas.exception.CanchaOcupadaException;
import com.reservas.ms_reservas.exception.ReservaNotFoundException;
import com.reservas.ms_reservas.model.Reserva;
import com.reservas.ms_reservas.repository.ReservaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;

    public ReservaService(ReservaRepository reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    public List<Reserva> listar() {
        return reservaRepository.findAll();
    }

    public List<Reserva> listarPorUsuario(String idUsuario) {
        return reservaRepository.findByIdUsuario(idUsuario);
    }

    public Reserva obtener(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new ReservaNotFoundException(id));
    }

    public Reserva crear(Reserva reserva) {
        var solapadas = reservaRepository.findSolapadas(
                reserva.getIdCancha(),
                reserva.getFecha(),
                reserva.getHoraInicio(),
                reserva.getHoraFin()
        );
        if (!solapadas.isEmpty()) {
            throw new CanchaOcupadaException(
                reserva.getIdCancha(),
                reserva.getFecha(),
                reserva.getHoraInicio(),
                reserva.getHoraFin()
            );
        }
        reserva.setEstado("PENDIENTE");
        reserva.setFechaCreacion(LocalDateTime.now());
        return reservaRepository.save(reserva);
    }

    public Reserva actualizar(Long id, Reserva data) {
        Reserva existente = obtener(id);
        existente.setIdCancha(data.getIdCancha());
        existente.setIdUsuario(data.getIdUsuario());
        existente.setFecha(data.getFecha());
        existente.setHoraInicio(data.getHoraInicio());
        existente.setHoraFin(data.getHoraFin());

        var solapadas = reservaRepository.findSolapadas(
                existente.getIdCancha(),
                existente.getFecha(),
                existente.getHoraInicio(),
                existente.getHoraFin()
        );
        solapadas.removeIf(r -> r.getId().equals(id));
        if (!solapadas.isEmpty()) {
            throw new CanchaOcupadaException(
                existente.getIdCancha(),
                existente.getFecha(),
                existente.getHoraInicio(),
                existente.getHoraFin()
            );
        }
        return reservaRepository.save(existente);
    }

    public void eliminar(Long id) {
        if (!reservaRepository.existsById(id)) {
            throw new ReservaNotFoundException(id);
        }
        reservaRepository.deleteById(id);
    }
}