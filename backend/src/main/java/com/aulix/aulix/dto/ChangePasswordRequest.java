package com.aulix.aulix.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Cambio de contraseña del usuario autenticado. La contraseña nueva usa la
 * misma regla fuerte que el registro (validators.js): min. 8 caracteres,
 * mayúscula, minúscula, número y carácter especial.
 */
public record ChangePasswordRequest(
    @NotBlank(message = "La contraseña actual es obligatoria") String currentPassword,
    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 8, message = "La nueva contraseña debe tener mínimo 8 caracteres")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{8,}$",
            message = "La nueva contraseña necesita: mínimo 8 caracteres, al menos una mayúscula, al menos una minúscula, al menos un número, al menos un carácter especial")
    String newPassword
) {}
