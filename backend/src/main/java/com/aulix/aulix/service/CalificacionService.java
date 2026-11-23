package com.aulix.aulix.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aulix.aulix.dto.CalificacionRequest;
import com.aulix.aulix.dto.CalificacionResponse;
import com.aulix.aulix.entity.Calificacion;
import com.aulix.aulix.entity.Entrega;
import com.aulix.aulix.entity.EstadoEntrega;
import com.aulix.aulix.entity.Usuario;
import com.aulix.aulix.repository.CalificacionRepository;
import com.aulix.aulix.repository.ClaseRepository;
import com.aulix.aulix.repository.EntregaRepository;
import com.aulix.aulix.repository.InscripcionRepository;
import com.aulix.aulix.repository.TareaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CalificacionService {

    private final CalificacionRepository calificacionRepository;
    private final EntregaRepository entregaRepository;
    private final TareaRepository tareaRepository;
    private final ClaseRepository claseRepository;
    private final InscripcionRepository inscripcionRepository;
    private final EntregaService entregaService;
    private final SecurityHelper security;

    /**
     * Califica (o actualiza la calificación de) una entrega. Solo el docente
     * de la clase, nota 0-10. Al crearla, la entrega pasa a CALIFICADA.
     */
    @Transactional
    public CalificacionResponse calificar(Long entregaId, CalificacionRequest req) {
        Usuario docente = security.exigirDocente();
        Entrega entrega = entregaService.entregaOr404(entregaId);
        if (!entrega.getTarea().getClase().getDocente().getId().equals(docente.getId())) {
            throw new AccessDeniedException("Solo el docente de la clase puede calificar");
        }
        Calificacion cal = calificacionRepository.findByEntregaId(entregaId)
                .orElseGet(() -> Calificacion.builder().entrega(entrega).docente(docente).build());
        cal.setNota(req.nota());
        cal.setComentario(req.comentario());
        cal.setDocente(docente);
        cal.setFechaCalificacion(java.time.LocalDateTime.now());
        calificacionRepository.save(cal);
        entrega.setEstado(EstadoEntrega.CALIFICADA);
        entregaRepository.save(entrega);
        return CalificacionResponse.of(cal);
    }

    /** Resumen del docente: por clase, entregas recibidas, por calificar y promedio. */
    public Map<String, Object> resumenDocente() {
        Usuario docente = security.exigirDocente();
        List<Calificacion> cals = calificacionRepository.delDocente(docente.getId());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("calificacionesTotales", cals.size());
        double promedio = cals.stream().mapToDouble(c -> c.getNota().doubleValue()).average().orElse(0);
        out.put("promedioGeneral", Math.round(promedio * 100.0) / 100.0);
        List<Map<String, Object>> porClase = new java.util.ArrayList<>();
        for (var clase : claseRepository.findByDocenteIdOrderByNombreAsc(docente.getId())) {
            long recibidas = entregaRepository.countByTareaClaseId(clase.getId());
            // Por calificar: entregas en estado ENTREGADA (sin nota) de esa clase.
            long pendientes = tareaRepository.findByClaseIdOrderByFechaVencimientoAsc(clase.getId()).stream()
                    .mapToLong(t -> entregaRepository.countByTareaIdAndEstado(t.getId(), EstadoEntrega.ENTREGADA))
                    .sum();
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("claseId", clase.getId());
            fila.put("claseNombre", clase.getNombre());
            fila.put("entregasRecibidas", recibidas);
            fila.put("porCalificar", pendientes);
            porClase.add(fila);
        }
        out.put("porClase", porClase);
        return out;
    }

    public Map<String, Object> resumenPorClase(Long claseId) {
        Usuario docente = security.exigirDocente();
        var clase = claseRepository.findById(claseId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Clase no encontrada"));
        if (!clase.getDocente().getId().equals(docente.getId())) {
            throw new AccessDeniedException("Esta clase no es tuya");
        }
        long recibidas = entregaRepository.countByTareaClaseId(claseId);
        long pendientes = tareaRepository.findByClaseIdOrderByFechaVencimientoAsc(claseId).stream()
                .mapToLong(t -> entregaRepository.countByTareaIdAndEstado(t.getId(), EstadoEntrega.ENTREGADA))
                .sum();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("claseId", claseId);
        out.put("claseNombre", clase.getNombre());
        out.put("estudiantes", inscripcionRepository.countByClaseId(claseId));
        out.put("entregasRecibidas", recibidas);
        out.put("porCalificar", pendientes);
        return out;
    }

    /** Calificaciones del estudiante (opcionalmente por materia). El estudiante nunca edita nota/comentario. */
    public List<CalificacionResponse> calificacionesEstudiante(Long materiaId) {
        Usuario estudiante = security.exigirEstudiante();
        return calificacionRepository.delEstudiante(estudiante.getId(), materiaId).stream()
                .map(CalificacionResponse::of).toList();
    }

    /**
     * Exporta calificaciones a CSV (docente). Columnas: alumno, correo, tarea,
     * clase, nota, comentario, fecha. Filtros opcionales materiaId y ciclo.
     */
    public String exportarCsv(Long materiaId, Integer ciclo) {
        Usuario docente = security.exigirDocente();
        List<Calificacion> cals = calificacionRepository.delDocente(docente.getId());
        StringBuilder csv = new StringBuilder("alumno,correo,tarea,clase,nota,comentario,fecha\n");
        for (Calificacion c : cals) {
            var e = c.getEntrega();
            var t = e.getTarea();
            if (materiaId != null && !t.getClase().getId().equals(materiaId)) {
                continue;
            }
            if (ciclo != null && !t.getClase().getCiclo().equals(ciclo)) {
                continue;
            }
            csv.append(csvCell(e.getEstudiante().getNombre())).append(",")
                    .append(csvCell(e.getEstudiante().getEmail())).append(",")
                    .append(csvCell(t.getTitulo())).append(",")
                    .append(csvCell(t.getClase().getNombre())).append(",")
                    .append(c.getNota()).append(",")
                    .append(csvCell(c.getComentario())).append(",")
                    .append(c.getFechaCalificacion()).append("\n");
        }
        return csv.toString();
    }

    private String csvCell(String v) {
        if (v == null) {
            return "";
        }
        String limpio = v.replace("\"", "\"\"");
        return "\"" + limpio + "\"";
    }
}
