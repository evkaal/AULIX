package com.aulix.aulix.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.aulix.aulix.entity.Clase;
import com.aulix.aulix.entity.Tarea;
import com.aulix.aulix.entity.Usuario;
import com.aulix.aulix.repository.ClaseRepository;
import com.aulix.aulix.repository.TareaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Calendario. Docente: activaciones y vencimientos de sus tareas.
 * Estudiante: horario recurrente de sus clases (diasSemana + horas) y
 * vencimientos de sus tareas visibles. El horario no se materializa en
 * filas: se genera a partir de diasSemana en el mes pedido.
 */
@Service
@RequiredArgsConstructor
public class CalendarioService {

    private final TareaRepository tareaRepository;
    private final ClaseRepository claseRepository;
    private final ClaseService claseService;
    private final SecurityHelper security;

    public Map<String, Object> calendarioDocente(String mes, Long materiaId) {
        Usuario docente = security.exigirDocente();
        YearMonth ym = mes == null ? YearMonth.now() : YearMonth.parse(mes);
        LocalDateTime desde = ym.atDay(1).atStartOfDay();
        LocalDateTime hasta = ym.plusMonths(1).atDay(1).atStartOfDay();
        List<Tarea> tareas = tareaRepository.delDocenteEnMes(docente.getId(), desde, hasta);
        List<Map<String, Object>> eventos = new ArrayList<>();
        for (Tarea t : tareas) {
            if (materiaId != null && !t.getClase().getId().equals(materiaId)) {
                continue;
            }
            if (t.getFechaActivacion() != null && !t.getFechaActivacion().isBefore(desde)
                    && t.getFechaActivacion().isBefore(hasta)) {
                eventos.add(evento(t, "activacion", t.getFechaActivacion()));
            }
            if (t.getFechaVencimiento() != null && !t.getFechaVencimiento().isBefore(desde)
                    && t.getFechaVencimiento().isBefore(hasta)) {
                eventos.add(evento(t, "vencimiento", t.getFechaVencimiento()));
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("mes", ym.toString());
        out.put("eventos", eventos);
        return out;
    }

    public Map<String, Object> calendarioEstudiante(String mes) {
        Usuario estudiante = security.exigirEstudiante();
        YearMonth ym = mes == null ? YearMonth.now() : YearMonth.parse(mes);
        LocalDateTime desde = ym.atDay(1).atStartOfDay();
        LocalDateTime hasta = ym.plusMonths(1).atDay(1).atStartOfDay();
        List<Map<String, Object>> eventos = new ArrayList<>();
        // Horario recurrente: por cada clase inscrita, por cada dia del mes que coincida con diasSemana.
        for (var c : claseService.listar(null, null)) {
            Clase clase = claseRepository.findById(c.id()).orElseThrow();
            if (clase.getDiasSemana() == null || clase.getHoraInicio() == null) {
                continue;
            }
            for (LocalDate dia = ym.atDay(1); !dia.isAfter(ym.atEndOfMonth()); dia = dia.plusDays(1)) {
                if (coincideDia(clase.getDiasSemana(), dia)) {
                    Map<String, Object> e = new LinkedHashMap<>();
                    e.put("tipo", "clase");
                    e.put("titulo", clase.getNombre());
                    e.put("claseId", clase.getId());
                    e.put("fecha", dia.atTime(clase.getHoraInicio()));
                    e.put("horaFin", clase.getHoraFin());
                    e.put("aula", clase.getAula());
                    eventos.add(e);
                }
            }
        }
        for (Tarea t : tareaRepository.vencimientosEstudianteEnMes(estudiante.getId(), desde, hasta)) {
            eventos.add(evento(t, "vencimiento", t.getFechaVencimiento()));
        }
        eventos.sort((a, b) -> String.valueOf(a.get("fecha")).compareTo(String.valueOf(b.get("fecha"))));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("mes", ym.toString());
        out.put("eventos", eventos);
        return out;
    }

    private Map<String, Object> evento(Tarea t, String tipo, LocalDateTime fecha) {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("tipo", tipo);
        e.put("titulo", t.getTitulo());
        e.put("tareaId", t.getId());
        e.put("claseId", t.getClase().getId());
        e.put("claseNombre", t.getClase().getNombre());
        e.put("fecha", fecha);
        e.put("estado", t.getEstado());
        return e;
    }

    private boolean coincideDia(String diasSemana, LocalDate dia) {
        String codigo = switch (dia.getDayOfWeek()) {
            case MONDAY -> "LUN";
            case TUESDAY -> "MAR";
            case WEDNESDAY -> "MIE";
            case THURSDAY -> "JUE";
            case FRIDAY -> "VIE";
            case SATURDAY -> "SAB";
            case SUNDAY -> "DOM";
        };
        for (String d : diasSemana.split(",")) {
            if (d.trim().equalsIgnoreCase(codigo)) {
                return true;
            }
        }
        return false;
    }
}
