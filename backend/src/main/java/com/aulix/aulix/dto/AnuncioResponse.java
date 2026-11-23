package com.aulix.aulix.dto;

import java.time.LocalDateTime;

import com.aulix.aulix.entity.Anuncio;

public record AnuncioResponse(Long id, Long claseId, Long autorId, String autorNombre, String texto, LocalDateTime createdAt) {
    public static AnuncioResponse of(Anuncio a) {
        return new AnuncioResponse(a.getId(), a.getClase().getId(), a.getAutor().getId(), a.getAutor().getNombre(), a.getTexto(), a.getCreatedAt());
    }
}
