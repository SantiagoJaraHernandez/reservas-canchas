package com.reservas.ms_reservas.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.reservas.ms_reservas.model.Cancha;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CanchaDTO {

    private Long id;

    @NotBlank(message = "El nombre de la cancha es requerido")
    @Size(max = 100, message = "El nombre admite maximo 100 caracteres")
    private String nombre;

    @NotBlank(message = "El tipo de cancha es requerido")
    @JsonAlias({"tipoCancha"})
    @Size(max = 50, message = "El tipo admite maximo 50 caracteres")
    private String tipo;

    @NotNull(message = "El precio por hora es requerido")
    @Positive(message = "El precio por hora debe ser mayor a 0")
    @JsonAlias({"precioHora", "precioPorHora", "precio_por_hora"})
    @Max(value = 10000000, message = "Precio por hora fuera de rango")
    private Double precioHora;

    private Boolean activa;

    @Size(max = 500, message = "La descripcion admite maximo 500 caracteres")
    private String descripcion;

    public static CanchaDTO fromEntity(Cancha cancha) {
        return new CanchaDTO(
                cancha.getId(),
                cancha.getNombre(),
                cancha.getTipo(),
                cancha.getPrecioHora(),
                cancha.getActiva(),
                cancha.getDescripcion()
        );
    }

    public Cancha toEntity() {
        Cancha cancha = new Cancha();
        cancha.setId(this.id);
        cancha.setNombre(this.nombre);
        cancha.setTipo(this.tipo);
        cancha.setPrecioHora(this.precioHora);
        cancha.setActiva(this.activa != null ? this.activa : true);
        cancha.setDescripcion(this.descripcion);
        return cancha;
    }
}