package com.aulix.aulix.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.aulix.aulix.entity.Calificacion;

public record CalificacionResponse(Long id, Long entregaId, Long tareaId, String tareaTitulo,
        Long estudianteId, String estudianteNombre, BigDecimal nota, String comentario,
        String docenteNombre, LocalDateTime fechaCalificacion) {

    public static CalificacionResponse of(Calificacion c) {
        return new CalificacionResponse(c.getId(), c.getEntrega().getId(), c.getEntrega().getTarea().getId(),
                c.getEntrega().getTarea().getTitulo(), c.getEntrega().getEstudiante().getId(),
                c.getEntrega().getEstudiante().getNombre(), c.getNota(), c.getComentario(),
                c.getDocente().getNombre(), c.getFechaCalificacion());
    }
}
