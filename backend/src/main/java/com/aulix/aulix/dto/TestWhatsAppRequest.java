package com.aulix.aulix.dto;

import jakarta.validation.constraints.NotBlank;

/** Número al que se enviará el WhatsApp de prueba
 *  (POST /api/auth/test-whatsapp). */
public record TestWhatsAppRequest(
    @NotBlank(message = "El teléfono es obligatorio")
    String telefono,
    /** Nombre para la variable {{1}} de la plantilla. Opcional. */
    String nombre
) {}
