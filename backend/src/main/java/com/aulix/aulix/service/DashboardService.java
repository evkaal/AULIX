package com.aulix.aulix.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.aulix.aulix.dto.ClaseResponse;
import com.aulix.aulix.dto.TareaResponse;
import com.aulix.aulix.entity.Entrega;
import com.aulix.aulix.entity.EstadoTarea;
import com.aulix.aulix.entity.Tarea;
import com.aulix.aulix.entity.Usuario;
import com.aulix.aulix.repository.AnuncioRepository;
import com.aulix.aulix.repository.CalificacionRepository;
import com.aulix.aulix.repository.ClaseRepository;
import com.aulix.aulix.repository.EntregaRepository;
import com.aulix.aulix.repository.InscripcionRepository;
import com.aulix.aulix.repository.TareaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Resúmenes del Inicio. Todos son agregaciones calculadas al momento,
 * no se guarda ningún KPI en la base de datos.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClaseRepository claseRepository;
    private final TareaRepository tareaRepository;
    private final EntregaRepository entregaRepository;
    private final InscripcionRepository inscripcionRepository;
    private final AnuncioRepository anuncioRepository;
    private final CalificacionRepository calificacionRepository;
    private final ClaseService claseService;
    private final SecurityHelper security;

    public Map<String, Object> resumenDocente() {
        Usuario docente = security.exigirDocente();
        List<ClaseResponse> clases = claseService.listar(null, null);
        List<Map<String, Object>> actividad = new ArrayList<>();
        for (Entrega e : entregaRepository.recientesDelDocente(docente.getId())) {
            if (actividad.size() >= 10) {
                break;
            }
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("id", e.getId());
            fila.put("iniciales", iniciales(e.getEstudiante().getNombre()));
            fila.put("tema", e.getTarea().getClase().getTema());
            fila.put("texto", e.getEstudiante().getNombre() + " entregó “" + e.getTarea().getTitulo() + "”.");
            fila.put("detalle", e.getTarea().getClase().getNombre() + " · " + e.getTarea().getClase().getGrupo()
                    + " · " + e.getFechaEntrega());
            actividad.add(fila);
        }
        List<TareaResponse> proximas = tareaRepository.findByClaseDocenteIdOrderByFechaVencimientoAsc(docente.getId())
                .stream()
                .filter(t -> t.getEstado() == EstadoTarea.ACTIVA && t.getFechaVencimiento() != null
                        && t.getFechaVencimiento().isAfter(LocalDateTime.now()))
                .limit(5)
                .map(t -> TareaResponse.of(t, entregaRepository.countByTareaId(t.getId()),
                        inscripcionRepository.countByClaseId(t.getClase().getId())))
                .toList();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("clases", clases.stream().map(c -> claseService.claseAMapa(
                claseRepository.findById(c.id()).orElseThrow())).toList());
        out.put("actividad", actividad);
        out.put("proximasEntregas", proximas);
        return out;
    }

    public Map<String, Object> resumenEstudiante() {
        Usuario estudiante = security.exigirEstudiante();
        List<ClaseResponse> clases = claseService.listar(null, null);
        List<Tarea> visibles = tareaRepository.buscarVisiblesParaEstudiante(estudiante.getId(), null, null);
        long pendientes = 0;
        long calificados = 0;
        List<Map<String, Object>> proximas = new ArrayList<>();
        for (Tarea t : visibles) {
            var r = claseService.conMiEstado(t, estudiante);
            if ("pendiente".equals(r.miEstado())) {
                pendientes++;
            }
            if ("calificada".equals(r.miEstado())) {
                calificados++;
            }
            if (t.getFechaVencimiento() != null && t.getFechaVencimiento().isAfter(LocalDateTime.now())) {
                Map<String, Object> fila = new LinkedHashMap<>();
                fila.put("tareaId", t.getId());
                fila.put("titulo", t.getTitulo());
                fila.put("claseNombre", t.getClase().getNombre());
                fila.put("fechaVencimiento", t.getFechaVencimiento());
                fila.put("miEstado", r.miEstado());
                proximas.add(fila);
            }
        }
        List<Map<String, Object>> anuncios = new ArrayList<>();
        for (var c : clases) {
            for (var a : anuncioRepository.findByClaseIdOrderByCreatedAtDesc(c.id())) {
                Map<String, Object> fila = new LinkedHashMap<>();
                fila.put("id", a.getId());
                fila.put("claseNombre", c.nombre());
                fila.put("texto", a.getTexto());
                fila.put("autor", a.getAutor().getNombre());
                fila.put("createdAt", a.getCreatedAt());
                anuncios.add(fila);
                if (anuncios.size() >= 10) {
                    break;
                }
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("materias", clases.stream().map(c -> claseService.claseAMapa(
                claseRepository.findById(c.id()).orElseThrow())).toList());
        out.put("clases", out.get("materias"));
        out.put("tareasPendientes", pendientes);
        out.put("trabajosCalificados", calificados);
        out.put("proximasEntregas", proximas);
        out.put("anuncios", anuncios);
        return out;
    }

    private String iniciales(String nombre) {
        String[] partes = nombre.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : partes) {
            if (!p.isEmpty() && sb.length() < 2) {
                sb.append(Character.toUpperCase(p.charAt(0)));
            }
        }
        return sb.toString();
    }
}
