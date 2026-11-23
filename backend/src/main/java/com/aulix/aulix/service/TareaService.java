package com.aulix.aulix.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aulix.aulix.dto.ProgramacionRequest;
import com.aulix.aulix.dto.RecursoResponse;
import com.aulix.aulix.dto.TareaRequest;
import com.aulix.aulix.dto.TareaResponse;
import com.aulix.aulix.entity.Clase;
import com.aulix.aulix.entity.EstadoTarea;
import com.aulix.aulix.entity.Rol;
import com.aulix.aulix.entity.Tarea;
import com.aulix.aulix.entity.Usuario;
import com.aulix.aulix.repository.ClaseRepository;
import com.aulix.aulix.repository.EntregaRepository;
import com.aulix.aulix.repository.InscripcionRepository;
import com.aulix.aulix.repository.RecursoRepository;
import com.aulix.aulix.repository.TareaRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TareaService {

    private final TareaRepository tareaRepository;
    private final ClaseRepository claseRepository;
    private final EntregaRepository entregaRepository;
    private final InscripcionRepository inscripcionRepository;
    private final RecursoRepository recursoRepository;
    private final ClaseService claseService;
    private final SecurityHelper security;

    public Tarea tareaOr404(Long id) {
        return tareaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));
    }

    private void exigirDocenteDeLaTarea(Tarea t) {
        Usuario docente = security.exigirDocente();
        if (!t.getClase().getDocente().getId().equals(docente.getId())) {
            throw new AccessDeniedException("Esta tarea no es de tus clases");
        }
    }

    /** Estudiante: la tarea debe ser visible (ACTIVA y de una clase donde esta inscrito). */
    private void exigirVisibleParaEstudiante(Tarea t) {
        Usuario estudiante = security.exigirEstudiante();
        if (t.getEstado() != EstadoTarea.ACTIVA
                || !inscripcionRepository.existsByUsuarioIdAndClaseId(estudiante.getId(), t.getClase().getId())) {
            throw new AccessDeniedException("Esta tarea no está disponible para ti");
        }
    }

    public List<TareaResponse> listarDocente(Long materiaId, String estado, String q) {
        Usuario docente = security.exigirDocente();
        EstadoTarea est = estado == null || estado.isBlank() ? null : EstadoTarea.valueOf(estado.toUpperCase());
        List<Tarea> tareas = tareaRepository.buscarDelDocente(docente.getId(), materiaId, est, vacioANull(q));
        List<TareaResponse> out = new ArrayList<>();
        for (Tarea t : tareas) {
            out.add(TareaResponse.of(t, entregaRepository.countByTareaId(t.getId()),
                    inscripcionRepository.countByClaseId(t.getClase().getId())));
        }
        return out;
    }

    public List<TareaResponse> listarEstudiante(String estado, Long materiaId, String q) {
        Usuario estudiante = security.exigirEstudiante();
        List<Tarea> tareas = tareaRepository.buscarVisiblesParaEstudiante(estudiante.getId(), materiaId, vacioANull(q));
        List<TareaResponse> out = new ArrayList<>();
        for (Tarea t : tareas) {
            TareaResponse r = claseService.conMiEstado(t, estudiante);
            if (estado != null && !estado.isBlank() && !estado.equalsIgnoreCase(r.miEstado())) {
                continue;
            }
            out.add(r);
        }
        return out;
    }

    @Transactional
    public TareaResponse crear(TareaRequest req) {
        Usuario docente = security.exigirDocente();
        Clase clase = claseRepository.findById(req.claseId())
                .orElseThrow(() -> new EntityNotFoundException("Clase no encontrada"));
        if (!clase.getDocente().getId().equals(docente.getId())) {
            throw new AccessDeniedException("Esta clase no es tuya");
        }
        EstadoTarea estado = req.estado() != null ? EstadoTarea.valueOf(req.estado().toUpperCase()) : EstadoTarea.ACTIVA;
        Tarea tarea = Tarea.builder()
                .clase(clase)
                .titulo(req.titulo())
                .descripcion(req.descripcion())
                .instrucciones(req.instrucciones())
                .fechaActivacion(req.fechaActivacion())
                .fechaVencimiento(req.fechaVencimiento())
                .activacionAutomatica(req.activacionAutomatica() == null || req.activacionAutomatica())
                .estado(estado)
                .autor(docente)
                .build();
        tareaRepository.save(tarea);
        return TareaResponse.of(tarea, 0, inscripcionRepository.countByClaseId(clase.getId()));
    }

    @Transactional
    public TareaResponse actualizar(Long id, TareaRequest req) {
        Tarea tarea = tareaOr404(id);
        exigirDocenteDeLaTarea(tarea);
        if (req.titulo() != null) tarea.setTitulo(req.titulo());
        if (req.descripcion() != null) tarea.setDescripcion(req.descripcion());
        if (req.instrucciones() != null) tarea.setInstrucciones(req.instrucciones());
        if (req.fechaActivacion() != null) tarea.setFechaActivacion(req.fechaActivacion());
        if (req.fechaVencimiento() != null) tarea.setFechaVencimiento(req.fechaVencimiento());
        if (req.activacionAutomatica() != null) tarea.setActivacionAutomatica(req.activacionAutomatica());
        if (req.estado() != null) tarea.setEstado(EstadoTarea.valueOf(req.estado().toUpperCase()));
        tareaRepository.save(tarea);
        return TareaResponse.of(tarea, entregaRepository.countByTareaId(id),
                inscripcionRepository.countByClaseId(tarea.getClase().getId()));
    }

    @Transactional
    public TareaResponse actualizarProgramacion(Long id, ProgramacionRequest req) {
        Tarea tarea = tareaOr404(id);
        exigirDocenteDeLaTarea(tarea);
        if (req.fechaActivacion() != null) tarea.setFechaActivacion(req.fechaActivacion());
        if (req.fechaVencimiento() != null) tarea.setFechaVencimiento(req.fechaVencimiento());
        if (req.activacionAutomatica() != null) tarea.setActivacionAutomatica(req.activacionAutomatica());
        if (req.estado() != null) tarea.setEstado(EstadoTarea.valueOf(req.estado().toUpperCase()));
        tareaRepository.save(tarea);
        return TareaResponse.of(tarea, entregaRepository.countByTareaId(id),
                inscripcionRepository.countByClaseId(tarea.getClase().getId()));
    }

    /** Detalle + instrucciones + recursos + miEntrega si es estudiante. */
    public Map<String, Object> detalle(Long id) {
        Tarea tarea = tareaOr404(id);
        Usuario u = security.actual();
        TareaResponse base;
        if (u.getRol() == Rol.DOCENTE) {
            exigirDocenteDeLaTarea(tarea);
            base = TareaResponse.of(tarea, entregaRepository.countByTareaId(id),
                    inscripcionRepository.countByClaseId(tarea.getClase().getId()));
        } else {
            exigirVisibleParaEstudiante(tarea);
            base = claseService.conMiEstado(tarea, u);
        }
        List<RecursoResponse> recursos = recursoRepository.findByTareaIdOrderByIdAsc(id).stream()
                .map(RecursoResponse::of).toList();
        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("tarea", base);
        out.put("recursos", recursos);
        if (u.getRol() == Rol.ESTUDIANTE) {
            entregaRepository.findByTareaIdAndEstudianteId(id, u.getId())
                    .ifPresent(e -> out.put("miEntrega", e.getId()));
        }
        return out;
    }

    @Transactional
    public void eliminar(Long id) {
        Tarea tarea = tareaOr404(id);
        exigirDocenteDeLaTarea(tarea);
        if (entregaRepository.countByTareaId(id) > 0) {
            throw new IllegalArgumentException("No se puede eliminar la tarea porque ya tiene entregas de estudiantes");
        }
        if (!recursoRepository.findByTareaIdOrderByIdAsc(id).isEmpty()) {
            throw new IllegalArgumentException("No se puede eliminar la tarea porque tiene recursos adjuntos");
        }
        tareaRepository.delete(tarea);
    }

    private String vacioANull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
