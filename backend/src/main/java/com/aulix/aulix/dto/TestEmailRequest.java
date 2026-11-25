package com.aulix.aulix.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Correo al que se enviará el correo de prueba de Resend
 *  (POST /api/auth/test-email). */
public record TestEmailRequest(
    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no es válido")
    String email
) {}
