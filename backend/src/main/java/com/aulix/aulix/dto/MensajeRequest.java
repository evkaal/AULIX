package com.aulix.aulix.dto;

import jakarta.validation.constraints.NotBlank;

public record MensajeRequest(@NotBlank(message = "El texto es obligatorio") String texto) {}
