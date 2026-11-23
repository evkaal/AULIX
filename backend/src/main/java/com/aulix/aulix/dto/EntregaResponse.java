package com.aulix.aulix.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.aulix.aulix.entity.Entrega;
import com.aulix.aulix.entity.EstadoEntrega;

/** aTiempo se calcula (fechaEntrega <= fechaVencimiento). comentario solo se incluye si lo pide autor o docente. */
public record EntregaResponse(Long id, Long tareaId, String tareaTitulo, Long estudianteId, String estudianteNombre,
        String archivoNombre, String archivoRuta, String archivoTipo, Long archivoTamanoBytes, Integer paginas,
        String comentario, LocalDateTime fechaEntrega, EstadoEntrega estado, boolean aTiempo,
        BigDecimal nota, String comentarioCalificacion) {

    public static EntregaResponse of(Entrega e, boolean incluirComentario, BigDecimal nota, String comentarioCalificacion) {
        boolean aTiempo = e.getTarea().getFechaVencimiento() == null || !e.getFechaEntrega().isAfter(e.getTarea().getFechaVencimiento());
        return new EntregaResponse(e.getId(), e.getTarea().getId(), e.getTarea().getTitulo(),
                e.getEstudiante().getId(), e.getEstudiante().getNombre(),
                e.getArchivoNombre(), e.getArchivoRuta(), e.getArchivoTipo(), e.getArchivoTamanoBytes(),
                e.getPaginas(), incluirComentario ? e.getComentario() : null,
                e.getFechaEntrega(), e.getEstado(), aTiempo, nota, comentarioCalificacion);
    }
}
