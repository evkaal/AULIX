package com.aulix.aulix.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.aulix.aulix.dto.AnuncioRequest;
import com.aulix.aulix.dto.AnuncioResponse;
import com.aulix.aulix.dto.ClaseRequest;
import com.aulix.aulix.dto.ClaseResponse;
import com.aulix.aulix.dto.RecursoResponse;
import com.aulix.aulix.dto.TareaResponse;
import com.aulix.aulix.dto.UnirseRequest;
import com.aulix.aulix.entity.Anuncio;
import com.aulix.aulix.entity.Clase;
import com.aulix.aulix.entity.Entrega;
import com.aulix.aulix.entity.EstadoTarea;
import com.aulix.aulix.entity.Inscripcion;
import com.aulix.aulix.entity.Recurso;
import com.aulix.aulix.entity.Rol;
import com.aulix.aulix.entity.Tarea;
import com.aulix.aulix.entity.TipoRecurso;
import com.aulix.aulix.entity.Usuario;
import com.aulix.aulix.repository.AnuncioRepository;
import com.aulix.aulix.repository.CalificacionRepository;
import com.aulix.aulix.repository.ClaseRepository;
import com.aulix.aulix.repository.ConversacionRepository;
import com.aulix.aulix.repository.EntregaRepository;
import com.aulix.aulix.repository.InscripcionRepository;
import com.aulix.aulix.repository.RecursoRepository;
import com.aulix.aulix.repository.TareaRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClaseService {

    private final ClaseRepository claseRepository;
    private final InscripcionRepository inscripcionRepository;
    private final TareaRepository tareaRepository;
    private final EntregaRepository entregaRepository;
    private final CalificacionRepository calificacionRepository;
    private final RecursoRepository recursoRepository;
    private final AnuncioRepository anuncioRepository;
    private final ConversacionRepository conversacionRepository;
    private final ArchivoService archivoService;
    private final SecurityHelper security;

    // ---------- Lectura ----------

    public Clase claseOr404(Long id) {
        return claseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Clase no encontrada"));
    }

    /** Docente dueño o estudiante inscrito; si no, 403. */
    public Clase exigirAcceso(Long claseId) {
        Clase clase = claseOr404(claseId);
        Usuario u = security.actual();
        if (u.getRol() == Rol.DOCENTE) {
            if (!clase.getDocente().getId().equals(u.getId())) {
                throw new AccessDeniedException("Esta clase no es tuya");
            }
        } else if (!inscripcionRepository.existsByUsuarioIdAndClaseId(u.getId(), claseId)) {
            throw new AccessDeniedException("No estás inscrito en esta clase");
        }
        return clase;
    }

    public Clase exigirDocenteDueno(Long claseId) {
        Clase clase = claseOr404(claseId);
        Usuario docente = security.exigirDocente();
        if (!clase.getDocente().getId().equals(docente.getId())) {
            throw new AccessDeniedException("Esta clase no es tuya");
        }
        return clase;
    }

    public List<ClaseResponse> listar(Integer ciclo, String q) {
        Usuario u = security.actual();
        List<Clase> clases = u.getRol() == Rol.DOCENTE
                ? claseRepository.buscarDelDocente(u.getId(), ciclo, vacioANull(q))
                : claseRepository.buscarInscritas(u.getId(), ciclo, vacioANull(q));
        List<ClaseResponse> out = new ArrayList<>();
        for (Clase c : clases) {
            out.add(ClaseResponse.of(c, inscripcionRepository.countByClaseId(c.getId()),
                    tareaRepository.countByClaseIdAndEstado(c.getId(), EstadoTarea.ACTIVA)));
        }
        return out;
    }

    public ClaseResponse obtener(Long id) {
        Clase clase = exigirAcceso(id);
        return ClaseResponse.of(clase, inscripcionRepository.countByClaseId(id),
                tareaRepository.countByClaseIdAndEstado(id, EstadoTarea.ACTIVA));
    }

    // ---------- Escritura (docente) ----------

    @Transactional
    public ClaseResponse crear(ClaseRequest req) {
        Usuario docente = security.exigirDocente();
        Clase clase = Clase.builder()
                .nombre(req.nombre())
                .grupo(req.grupo())
                .ciclo(req.ciclo() != null ? req.ciclo() : 2026)
                .descripcion(req.descripcion())
                .docente(docente)
                .diasSemana(req.diasSemana())
                .horaInicio(req.horaInicio())
                .horaFin(req.horaFin())
                .aula(req.aula())
                .tema(req.tema())
                .simbolo(req.simbolo())
                .icono(req.icono())
                .codigoInvitacion(generarCodigo(req.nombre(), req.grupo(), req.ciclo() != null ? req.ciclo() : 2026))
                .estado("EN_CURSO")
                .build();
        claseRepository.save(clase);
        // La conversación grupal se crea la primera vez que se usa
        // (MensajeService.conversacionDe), no aquí.
        return ClaseResponse.of(clase, 0, 0);
    }

    @Transactional
    public ClaseResponse actualizar(Long id, ClaseRequest req) {
        Clase clase = exigirDocenteDueno(id);
        if (req.nombre() != null) clase.setNombre(req.nombre());
        if (req.grupo() != null) clase.setGrupo(req.grupo());
        if (req.ciclo() != null) clase.setCiclo(req.ciclo());
        if (req.descripcion() != null) clase.setDescripcion(req.descripcion());
        if (req.diasSemana() != null) clase.setDiasSemana(req.diasSemana());
        if (req.horaInicio() != null) clase.setHoraInicio(req.horaInicio());
        if (req.horaFin() != null) clase.setHoraFin(req.horaFin());
        if (req.aula() != null) clase.setAula(req.aula());
        if (req.tema() != null) clase.setTema(req.tema());
        if (req.simbolo() != null) clase.setSimbolo(req.simbolo());
        if (req.icono() != null) clase.setIcono(req.icono());
        claseRepository.save(clase);
        return ClaseResponse.of(clase, inscripcionRepository.countByClaseId(id),
                tareaRepository.countByClaseIdAndEstado(id, EstadoTarea.ACTIVA));
    }

    /**
     * Elimina una clase vacía del docente. Por seguridad no borra en cascada:
     * si ya tiene alumnos, tareas, materiales, anuncios o una conversación,
     * se rechaza con 400 y el docente debe vaciarla primero (eso protege el
     * historial de entregas y calificaciones).
     */
    @Transactional
    public void eliminar(Long id) {
        Clase clase = exigirDocenteDueno(id);
        if (inscripcionRepository.countByClaseId(id) > 0) {
            throw new IllegalArgumentException("No se puede eliminar la clase porque ya tiene alumnos inscritos");
        }
        if (tareaRepository.countByClaseId(id) > 0) {
            throw new IllegalArgumentException("No se puede eliminar la clase porque ya tiene tareas");
        }
        if (!recursoRepository.findByClaseIdOrderByIdAsc(id).isEmpty()) {
            throw new IllegalArgumentException("No se puede eliminar la clase porque tiene materiales");
        }
        if (!anuncioRepository.findByClaseIdOrderByCreatedAtDesc(id).isEmpty()) {
            throw new IllegalArgumentException("No se puede eliminar la clase porque tiene anuncios publicados");
        }
        if (conversacionRepository.findByClaseId(id).isPresent()) {
            throw new IllegalArgumentException("No se puede eliminar la clase porque ya tiene una conversación");
        }
        claseRepository.delete(clase);
    }

    @Transactional
    public ClaseResponse unirse(UnirseRequest req) {
        Usuario estudiante = security.exigirEstudiante();
        Clase clase = claseRepository.findByCodigoInvitacion(req.codigo().trim().toUpperCase())
                .orElseThrow(() -> new EntityNotFoundException("Código de invitación inválido"));
        if (inscripcionRepository.existsByUsuarioIdAndClaseId(estudiante.getId(), clase.getId())) {
            throw new IllegalArgumentException("Ya estás inscrito en esta clase");
        }
        inscripcionRepository.save(Inscripcion.builder().usuario(estudiante).clase(clase).build());
        return ClaseResponse.of(clase, inscripcionRepository.countByClaseId(clase.getId()),
                tareaRepository.countByClaseIdAndEstado(clase.getId(), EstadoTarea.ACTIVA));
    }

    // ---------- Alumnos (docente) ----------

    public Page<Map<String, Object>> alumnos(Long claseId, String filtro, String q, int page, int size) {
        exigirDocenteDueno(claseId);
        List<Inscripcion> insc = inscripcionRepository.buscarPorClase(claseId, vacioANull(q));
        long totalTareas = tareaRepository.findByClaseIdOrderByFechaVencimientoAsc(claseId).size();
        List<Map<String, Object>> filas = new ArrayList<>();
        for (Inscripcion i : insc) {
            Usuario a = i.getUsuario();
            List<Entrega> entregas = entregaRepository.porClaseYAlumno(claseId, a.getId());
            long recibidas = entregas.size();
            long porCalificar = entregas.stream().filter(e -> e.getEstado() == com.aulix.aulix.entity.EstadoEntrega.ENTREGADA).count();
            Double promedio = calificacionRepository.promedioPorAlumnoYClase(a.getId(), claseId);
            if ("pendientes".equalsIgnoreCase(filtro) && recibidas >= totalTareas) {
                continue;
            }
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("id", a.getId());
            fila.put("nombre", a.getNombre());
            fila.put("correo", a.getEmail());
            fila.put("grupo", a.getGrupo());
            fila.put("avatar", a.getAvatarUrl());
            fila.put("entregasRecibidas", recibidas);
            fila.put("entregasTotales", totalTareas);
            fila.put("porCalificar", porCalificar);
            fila.put("promedio", promedio == null ? null : Math.round(promedio * 100.0) / 100.0);
            filas.add(fila);
        }
        int from = Math.min(page * size, filas.size());
        int to = Math.min(from + size, filas.size());
        return new PageImpl<>(filas.subList(from, to), PageRequest.of(page, size), filas.size());
    }

    // ---------- Materiales y anuncios ----------

    public List<RecursoResponse> materiales(Long claseId) {
        exigirAcceso(claseId);
        List<Recurso> recursos = recursoRepository.findByClaseIdOrTareaClaseId(claseId, claseId);
        return recursos.stream().map(RecursoResponse::of).toList();
    }

    @Transactional
    public RecursoResponse subirMaterial(Long claseId, MultipartFile archivo, String tipo, String nombre, String url,
            Integer duracionMin) {
        Clase clase = exigirDocenteDueno(claseId);
        TipoRecurso tipoRecurso = tipo == null ? TipoRecurso.ARCHIVO : TipoRecurso.valueOf(tipo.toUpperCase());
        Recurso.RecursoBuilder b = Recurso.builder().clase(clase).tipo(tipoRecurso);
        if (tipoRecurso == TipoRecurso.VIDEO) {
            if (url == null || url.isBlank()) {
                throw new IllegalArgumentException("El material de tipo VIDEO necesita una URL");
            }
            b.nombre(nombre != null && !nombre.isBlank() ? nombre : url).url(url).duracionMin(duracionMin);
        } else {
            String guardado = archivoService.guardar(archivo);
            b.nombre(nombre != null && !nombre.isBlank() ? nombre : archivo.getOriginalFilename())
                    .url("/uploads/" + guardado)
                    .mime(archivo.getContentType())
                    .tamanoBytes(archivo.getSize());
        }
        return RecursoResponse.of(recursoRepository.save(b.build()));
    }

    public List<AnuncioResponse> anuncios(Long claseId) {
        exigirAcceso(claseId);
        return anuncioRepository.findByClaseIdOrderByCreatedAtDesc(claseId).stream().map(AnuncioResponse::of).toList();
    }

    @Transactional
    public AnuncioResponse crearAnuncio(Long claseId, AnuncioRequest req) {
        Clase clase = exigirDocenteDueno(claseId);
        Usuario autor = security.actual();
        Anuncio anuncio = anuncioRepository.save(Anuncio.builder().clase(clase).autor(autor).texto(req.texto()).build());
        return AnuncioResponse.of(anuncio);
    }

    // ---------- Vista del estudiante ----------

    public List<TareaResponse> misTareas(Long claseId) {
        Usuario estudiante = security.exigirEstudiante();
        exigirAcceso(claseId);
        List<Tarea> tareas = tareaRepository.findByClaseIdOrderByFechaVencimientoAsc(claseId).stream()
                .filter(t -> t.getEstado() == EstadoTarea.ACTIVA).toList();
        return tareas.stream().map(t -> conMiEstado(t, estudiante)).toList();
    }

    public Map<String, Object> miProgreso(Long claseId) {
        Usuario estudiante = security.exigirEstudiante();
        exigirAcceso(claseId);
        List<Tarea> tareas = tareaRepository.findByClaseIdOrderByFechaVencimientoAsc(claseId).stream()
                .filter(t -> t.getEstado() == EstadoTarea.ACTIVA).toList();
        long entregadas = 0;
        long calificadas = 0;
        List<Map<String, Object>> porTarea = new ArrayList<>();
        for (Tarea t : tareas) {
            TareaResponse r = conMiEstado(t, estudiante);
            if (r.miEntregaId() != null) entregadas++;
            if ("calificada".equals(r.miEstado())) calificadas++;
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("tareaId", t.getId());
            fila.put("titulo", t.getTitulo());
            fila.put("fechaVencimiento", t.getFechaVencimiento());
            fila.put("miEstado", r.miEstado());
            fila.put("miNota", r.miNota());
            porTarea.add(fila);
        }
        Double promedio = calificacionRepository.promedioPorAlumnoYClase(estudiante.getId(), claseId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("claseId", claseId);
        out.put("tareasTotales", tareas.size());
        out.put("entregadas", entregadas);
        out.put("calificadas", calificadas);
        out.put("pendientes", tareas.size() - entregadas);
        out.put("promedio", promedio == null ? null : Math.round(promedio * 100.0) / 100.0);
        out.put("porTarea", porTarea);
        return out;
    }

    /** TareaResponse con miEstado/miNota/miEntregaId para un estudiante. */
    public TareaResponse conMiEstado(Tarea t, Usuario estudiante) {
        var entrega = entregaRepository.findByTareaIdAndEstudianteId(t.getId(), estudiante.getId());
        String miEstado = "pendiente";
        java.math.BigDecimal miNota = null;
        Long miEntregaId = null;
        if (entrega.isPresent()) {
            miEntregaId = entrega.get().getId();
            var cal = calificacionRepository.findByEntregaId(entrega.get().getId());
            if (cal.isPresent()) {
                miEstado = "calificada";
                miNota = cal.get().getNota();
            } else {
                miEstado = "entregada";
            }
        }
        return new TareaResponse(t.getId(), t.getClase().getId(), t.getClase().getNombre(), t.getTitulo(),
                t.getDescripcion(), t.getInstrucciones(), t.getFechaPublicacion(), t.getFechaActivacion(),
                t.getFechaVencimiento(), t.isActivacionAutomatica(), t.getEstado(), miEstado, miNota, miEntregaId,
                entregaRepository.countByTareaId(t.getId()),
                inscripcionRepository.countByClaseId(t.getClase().getId()));
    }

    // ---------- Utilidades ----------

    private String vacioANull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private String generarCodigo(String nombre, String grupo, int ciclo) {
        String sinAcentos = Normalizer.normalize(nombre, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String prefijo = sinAcentos.replaceAll("[^A-Za-z]", "").toUpperCase();
        prefijo = prefijo.length() >= 3 ? prefijo.substring(0, 3) : prefijo;
        String grupoLimpio = grupo == null ? "" : grupo.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        String base = prefijo + "-" + grupoLimpio + "-" + ciclo;
        String codigo = base;
        int i = 2;
        while (claseRepository.existsByCodigoInvitacion(codigo)) {
            codigo = base + "-" + i++;
        }
        return codigo;
    }

    public Map<String, Object> claseAMapa(Clase c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("nombre", c.getNombre());
        m.put("grupo", c.getGrupo());
        m.put("ciclo", c.getCiclo());
        m.put("estudiantes", inscripcionRepository.countByClaseId(c.getId()));
        m.put("tareasActivas", tareaRepository.countByClaseIdAndEstado(c.getId(), EstadoTarea.ACTIVA));
        m.put("tema", c.getTema());
        m.put("icono", c.getIcono());
        m.put("simbolo", c.getSimbolo());
        m.put("formula", c.getSimbolo());
        return m;
    }
}
