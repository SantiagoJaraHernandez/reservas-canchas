package com.reservas.ms_reservas.service;

import com.reservas.ms_reservas.exception.CanchaNotFoundException;
import com.reservas.ms_reservas.model.Cancha;
import com.reservas.ms_reservas.repository.CanchaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CanchaService {

    private final CanchaRepository canchaRepository;

    public List<Cancha> listar() {
        log.info("Listing all canchas");
        return canchaRepository.findAll();
    }

    public List<Cancha> listarActivas() {
        log.info("Listing active canchas only");
        return canchaRepository.findByActivaTrue();
    }

    public Cancha obtener(Long id) {
        log.info("Getting cancha with id: {}", id);
        return canchaRepository.findById(id)
                .orElseThrow(() -> new CanchaNotFoundException("Cancha no encontrada con id: " + id));
    }

    public Cancha crear(Cancha cancha) {
        if (cancha.getActiva() == null) {
            cancha.setActiva(true);
        }
        log.info("Creating cancha: {}", cancha.getNombre());
        return canchaRepository.save(cancha);
    }

    public Cancha actualizar(Long id, Cancha canchaActualizada) {
        Cancha cancha = obtener(id);
        cancha.setNombre(canchaActualizada.getNombre());
        cancha.setTipo(canchaActualizada.getTipo());
        cancha.setPrecioHora(canchaActualizada.getPrecioHora());
        cancha.setDescripcion(canchaActualizada.getDescripcion());
        cancha.setActiva(canchaActualizada.getActiva() != null ? canchaActualizada.getActiva() : cancha.getActiva());
        log.info("Updating cancha with id: {}", id);
        return canchaRepository.save(cancha);
    }

    public void desactivar(Long id) {
        Cancha cancha = obtener(id);
        cancha.setActiva(false);
        log.info("Deactivating cancha with id: {}", id);
        canchaRepository.save(cancha);
    }

    public void eliminar(Long id) {
        obtener(id);
        log.info("Deleting cancha with id: {}", id);
        canchaRepository.deleteById(id);
    }
}
