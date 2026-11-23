package com.aulix.aulix.dto;

import java.time.LocalDateTime;

import com.aulix.aulix.entity.Mensaje;

public record MensajeResponse(Long id, Long conversacionId, Long autorId, String autorNombre, String autorAvatar,
        String texto, LocalDateTime fechaEnvio, String adjuntoNombre, String adjuntoRuta, Long adjuntoTamanoBytes) {
    public static MensajeResponse of(Mensaje m) {
        return new MensajeResponse(m.getId(), m.getConversacion().getId(), m.getAutor().getId(),
                m.getAutor().getNombre(), m.getAutor().getAvatarUrl(), m.getTexto(), m.getFechaEnvio(),
                m.getAdjuntoNombre(), m.getAdjuntoRuta(), m.getAdjuntoTamanoBytes());
    }
}
