package com.aulix.aulix.dto;

import com.aulix.aulix.entity.Recurso;
import com.aulix.aulix.entity.TipoRecurso;

public record RecursoResponse(Long id, Long tareaId, Long claseId, TipoRecurso tipo, String nombre, String url,
        String mime, Long tamanoBytes, Integer paginas, Integer duracionMin) {
    public static RecursoResponse of(Recurso r) {
        return new RecursoResponse(r.getId(), r.getTarea() != null ? r.getTarea().getId() : null,
                r.getClase() != null ? r.getClase().getId() : null, r.getTipo(), r.getNombre(), r.getUrl(),
                r.getMime(), r.getTamanoBytes(), r.getPaginas(), r.getDuracionMin());
    }
}
