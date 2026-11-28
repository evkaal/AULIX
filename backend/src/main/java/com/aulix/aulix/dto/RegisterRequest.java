package com.aulix.aulix.dto;

import com.aulix.aulix.entity.Rol;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Registro. La contrasena fuerte es la misma regla del frontend
 * (validators.js): min. 8, mayuscula, minuscula, numero y caracter especial.
 * El login con Google y la recuperacion de contrasena NO se implementan
 * (fuera de alcance, ver README).
 */
public record RegisterRequest(
    @NotBlank(message = "El nombre es obligatorio") String nombre,
    @NotBlank(message = "El email es obligatorio") @Email(message = "Formato de email inválido") String email,
    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener mínimo 8 caracteres")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{8,}$",
            message = "La contraseña necesita: mínimo 8 caracteres, al menos una mayúscula, al menos un número, al menos un carácter especial")
    String password,
    @NotNull(message = "El rol es obligatorio") Rol rol,
    /** Grupo del estudiante, ej. "3° A". Null para docentes. */
    String grupo,
    Integer ciclo,
    /** Teléfono móvil opcional para el SMS de bienvenida. Se guarda
     *  normalizado a E.164 (+521...); si no es válido se guarda null. */
    String telefono
) {}
