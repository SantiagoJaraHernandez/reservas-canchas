package com.reservas.ms_reservas.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cancha")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cancha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de la cancha es requerido")
    @Column(nullable = false)
    private String nombre;

    @NotBlank(message = "El tipo de cancha es requerido")
    @Column(nullable = false)
    private String tipo; // Ej: Futbol, Tenis, Basquetbol

    @Positive(message = "El precio por hora debe ser mayor a 0")
    @Column(nullable = false)
    private Double precioHora;

    @Column(nullable = false)
    private Boolean activa = true;

    @Column(columnDefinition = "TEXT")
    private String descripcion;
}
