package com.aulix.aulix.dto;

/** Respuesta de register/login: { token, user: {...} }. El frontend guarda token y user en la sesion. */
public record AuthResponse(String token, UserResponse user) {}
