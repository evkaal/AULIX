package com.aulix.aulix.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TareaRequest(
    @NotNull(message = "La clase es obligatoria") Long claseId,
    @NotBlank(message = "El título es obligatorio") String titulo,
    String descripcion,
    String instrucciones,
    LocalDateTime fechaActivacion,
    LocalDateTime fechaVencimiento,
    Boolean activacionAutomatica,
    String estado
) {}
