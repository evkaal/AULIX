package com.aulix.aulix.dto;

import java.time.LocalTime;

import jakarta.validation.constraints.NotBlank;

public record ClaseRequest(
    @NotBlank(message = "El nombre es obligatorio") String nombre,
    @NotBlank(message = "El grupo es obligatorio") String grupo,
    Integer ciclo,
    String descripcion,
    String diasSemana,
    LocalTime horaInicio,
    LocalTime horaFin,
    String aula,
    String tema,
    String simbolo,
    String icono
) {}
