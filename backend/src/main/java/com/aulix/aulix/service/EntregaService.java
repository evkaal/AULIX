package com.aulix.aulix.service;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.aulix.aulix.dto.EntregaResponse;
import com.aulix.aulix.entity.Entrega;
import com.aulix.aulix.entity.EstadoEntrega;
import com.aulix.aulix.entity.EstadoTarea;
import com.aulix.aulix.entity.Rol;
import com.aulix.aulix.entity.Tarea;
import com.aulix.aulix.entity.Usuario;
import com.aulix.aulix.repository.CalificacionRepository;
import com.aulix.aulix.repository.EntregaRepository;
import com.aulix.aulix.repository.InscripcionRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EntregaService {

    private final EntregaRepository entregaRepository;
    private final CalificacionRepository calificacionRepository;
    private final InscripcionRepository inscripcionRepository;
    private final TareaService tareaService;
    private final ClaseService claseService;
    private final ArchivoService archivoService;
    private final SecurityHelper security;

    public Entrega entregaOr404(Long id) {
        return entregaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Entrega no encontrada"));
    }

    /** Solo el autor de la entrega o el docente de la clase. */
    public Entrega exigirAcceso(Long entregaId) {
        Entrega entrega = entregaOr404(entregaId);
        Usuario u = security.actual();
        boolean esAutor = entrega.getEstudiante().getId().equals(u.getId());
        boolean esDocente = u.getRol() == Rol.DOCENTE
                && entrega.getTarea().getClase().getDocente().getId().equals(u.getId());
        if (!esAutor && !esDocente) {
            throw new AccessDeniedException("No tienes acceso a esta entrega");
        }
        return entrega;
    }

    private EntregaResponse aResponse(Entrega e, Usuario solicitante) {
        boolean puedeVerComentario = e.getEstudiante().getId().equals(solicitante.getId())
                || (solicitante.getRol() == Rol.DOCENTE
                        && e.getTarea().getClase().getDocente().getId().equals(solicitante.getId()));
        var cal = calificacionRepository.findByEntregaId(e.getId());
        return EntregaResponse.of(e, puedeVerComentario,
                cal.map(c -> c.getNota()).orElse(null),
                cal.map(c -> c.getComentario()).orElse(null));
    }

    /**
     * Una entrega por alumno y tarea: si ya existe, se actualiza la misma fila
     * (nuevo archivo y/o comentario). No se puede entregar una tarea
     * PROGRAMADA (invisible) ni de una clase donde no se está inscrito.
     */
    @Transactional
    public EntregaResponse entregar(Long tareaId, MultipartFile archivo, String comentario, Integer paginas) {
        Usuario estudiante = security.exigirEstudiante();
        Tarea tarea = tareaService.tareaOr404(tareaId);
        if (tarea.getEstado() != EstadoTarea.ACTIVA
                || !inscripcionRepository.existsByUsuarioIdAndClaseId(estudiante.getId(), tarea.getClase().getId())) {
            throw new AccessDeniedException("Esta tarea no está disponible para ti");
        }
        String guardado = archivoService.guardar(archivo);
        Entrega entrega = entregaRepository.findByTareaIdAndEstudianteId(tareaId, estudiante.getId())
                .orElseGet(() -> Entrega.builder().tarea(tarea).estudiante(estudiante).build());
        entrega.setArchivoNombre(archivo.getOriginalFilename());
        entrega.setArchivoRuta(guardado);
        entrega.setArchivoTipo(archivo.getContentType());
        entrega.setArchivoTamanoBytes(archivo.getSize());
        if (paginas != null) entrega.setPaginas(paginas);
        if (comentario != null) entrega.setComentario(comentario);
        entrega.setFechaEntrega(java.time.LocalDateTime.now());
        entrega.setEstado(EstadoEntrega.ENTREGADA);
        entregaRepository.save(entrega);
        return aResponse(entrega, estudiante);
    }

    public EntregaResponse obtener(Long entregaId) {
        Usuario u = security.actual();
        return aResponse(exigirAcceso(entregaId), u);
    }

    public Resource descargarArchivo(Long entregaId) {
        Entrega entrega = exigirAcceso(entregaId);
        if (entrega.getArchivoRuta() == null) {
            throw new EntityNotFoundException("Esta entrega no tiene archivo");
        }
        return archivoService.cargar(entrega.getArchivoRuta());
    }

    public String nombreArchivo(Long entregaId) {
        return exigirAcceso(entregaId).getArchivoNombre();
    }

    /** Revisión: nota + comentario + fecha. Solo autor o docente. */
    public java.util.Map<String, Object> revision(Long entregaId) {
        Entrega entrega = exigirAcceso(entregaId);
        var cal = calificacionRepository.findByEntregaId(entregaId);
        java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("entregaId", entrega.getId());
        out.put("tareaId", entrega.getTarea().getId());
        out.put("tareaTitulo", entrega.getTarea().getTitulo());
        out.put("estudiante", entrega.getEstudiante().getNombre());
        out.put("estado", entrega.getEstado());
        out.put("fechaEntrega", entrega.getFechaEntrega());
        out.put("aTiempo", entrega.getTarea().getFechaVencimiento() == null
                || !entrega.getFechaEntrega().isAfter(entrega.getTarea().getFechaVencimiento()));
        out.put("nota", cal.map(c -> c.getNota()).orElse(null));
        out.put("comentario", cal.map(c -> c.getComentario()).orElse(null));
        out.put("fechaCalificacion", cal.map(c -> c.getFechaCalificacion()).orElse(null));
        return out;
    }

    public List<EntregaResponse> entregasDeAlumnoEnClase(Long claseId, Long alumnoId) {
        Usuario docente = security.exigirDocente();
        // Verificación de propiedad aunque el alumno no tenga entregas todavía.
        claseService.exigirDocenteDueno(claseId);
        List<Entrega> entregas = entregaRepository.porClaseYAlumno(claseId, alumnoId);
        return entregas.stream().map(e -> aResponse(e, docente)).toList();
    }
}
