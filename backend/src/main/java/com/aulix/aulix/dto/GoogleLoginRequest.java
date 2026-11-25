package com.aulix.aulix.dto;

import jakarta.validation.constraints.NotBlank;

/** ID token de Google Identity Services que envía el frontend al pulsar
 *  "Continuar con Google". El backend lo verifica contra Google. */
public record GoogleLoginRequest(
    @NotBlank(message = "El token de Google es obligatorio") String idToken
) {}
