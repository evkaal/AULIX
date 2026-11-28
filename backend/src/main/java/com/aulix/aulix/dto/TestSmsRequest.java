package com.aulix.aulix.dto;

import jakarta.validation.constraints.NotBlank;

/** Número al que se enviará el SMS de prueba
 *  (POST /api/auth/test-sms). */
public record TestSmsRequest(
    @NotBlank(message = "El teléfono es obligatorio")
    String telefono,
    /** Nombre para el texto de bienvenida. Opcional. */
    String nombre
) {}
