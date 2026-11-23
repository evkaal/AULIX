package com.aulix.aulix.dto;

import java.time.LocalDateTime;

import com.aulix.aulix.entity.EstadoTarea;
import com.aulix.aulix.entity.Tarea;

/** Detalle de tarea. miEstado/miNota solo se rellenan para estudiantes (pendiente/entregada/calificada). */
public record TareaResponse(Long id, Long claseId, String claseNombre, String titulo, String descripcion,
        String instrucciones, LocalDateTime fechaPublicacion, LocalDateTime fechaActivacion,
        LocalDateTime fechaVencimiento, Boolean activacionAutomatica, EstadoTarea estado,
        String miEstado, java.math.BigDecimal miNota, Long miEntregaId,
        long entregasRecibidas, long entregasTotales) {

    public static TareaResponse of(Tarea t, long recibidas, long totales) {
        return new TareaResponse(t.getId(), t.getClase().getId(), t.getClase().getNombre(), t.getTitulo(),
                t.getDescripcion(), t.getInstrucciones(), t.getFechaPublicacion(), t.getFechaActivacion(),
                t.getFechaVencimiento(), t.isActivacionAutomatica(), t.getEstado(), null, null, null,
                recibidas, totales);
    }

    public static TareaResponse of(Tarea t) {
        return of(t, 0, 0);
    }
}
