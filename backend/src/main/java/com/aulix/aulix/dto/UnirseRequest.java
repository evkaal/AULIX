package com.aulix.aulix.dto;

import jakarta.validation.constraints.NotBlank;

public record UnirseRequest(@NotBlank(message = "El código es obligatorio") String codigo) {}
