package com.aulix.aulix.dto;

import jakarta.validation.constraints.NotBlank;

public record AnuncioRequest(@NotBlank(message = "El texto es obligatorio") String texto) {}
