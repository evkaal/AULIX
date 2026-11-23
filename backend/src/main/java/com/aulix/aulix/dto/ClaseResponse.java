package com.aulix.aulix.dto;

import java.time.LocalTime;

import com.aulix.aulix.entity.Clase;

public record ClaseResponse(Long id, String nombre, String grupo, Integer ciclo, String descripcion,
        Long docenteId, String docenteNombre, String diasSemana, LocalTime horaInicio, LocalTime horaFin,
        String aula, String tema, String simbolo, String icono, String codigoInvitacion, String estado,
        long estudiantes, long tareasActivas) {

    public static ClaseResponse of(Clase c, long estudiantes, long tareasActivas) {
        return new ClaseResponse(c.getId(), c.getNombre(), c.getGrupo(), c.getCiclo(), c.getDescripcion(),
                c.getDocente() != null ? c.getDocente().getId() : null,
                c.getDocente() != null ? c.getDocente().getNombre() : null,
                c.getDiasSemana(), c.getHoraInicio(), c.getHoraFin(), c.getAula(), c.getTema(),
                c.getSimbolo(), c.getIcono(), c.getCodigoInvitacion(), c.getEstado(), estudiantes, tareasActivas);
    }

    public static ClaseResponse of(Clase c) {
        return of(c, 0, 0);
    }
}
