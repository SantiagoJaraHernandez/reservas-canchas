package com.reservas.ms_reservas.repository;

import com.reservas.ms_reservas.model.Cancha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CanchaRepository extends JpaRepository<Cancha, Long> {

    List<Cancha> findByActivaTrue();

    @Query("SELECT c FROM Cancha c WHERE c.activa = true")
    List<Cancha> findAllActive();
}
