package com.aulix.aulix.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aulix.aulix.entity.EstadoTarea;
import com.aulix.aulix.entity.Tarea;

public interface TareaRepository extends JpaRepository<Tarea, Long> {
    List<Tarea> findByClaseIdOrderByFechaVencimientoAsc(Long claseId);
    long countByClaseId(Long claseId);
    List<Tarea> findByClaseDocenteIdOrderByFechaVencimientoAsc(Long docenteId);
    long countByClaseIdAndEstado(Long claseId, EstadoTarea estado);
    List<Tarea> findByEstadoAndFechaActivacionLessThanEqual(EstadoTarea estado, LocalDateTime fecha);

    @Query("SELECT t FROM Tarea t WHERE t.clase.docente.id = :docenteId "
            + "AND (:materiaId IS NULL OR t.clase.id = :materiaId) "
            + "AND (:estado IS NULL OR t.estado = :estado) "
            + "AND (:q IS NULL OR LOWER(t.titulo) LIKE LOWER(CONCAT('%', :q, '%'))) "
            + "ORDER BY t.fechaVencimiento ASC")
    List<Tarea> buscarDelDocente(@Param("docenteId") Long docenteId, @Param("materiaId") Long materiaId,
            @Param("estado") EstadoTarea estado, @Param("q") String q);

    /** Tareas visibles para un estudiante: solo las de sus clases y en estado ACTIVA. */
    @Query("SELECT t FROM Tarea t JOIN Inscripcion i ON i.clase = t.clase WHERE i.usuario.id = :usuarioId "
            + "AND t.estado = com.aulix.aulix.entity.EstadoTarea.ACTIVA "
            + "AND (:materiaId IS NULL OR t.clase.id = :materiaId) "
            + "AND (:q IS NULL OR LOWER(t.titulo) LIKE LOWER(CONCAT('%', :q, '%'))) "
            + "ORDER BY t.fechaVencimiento ASC")
    List<Tarea> buscarVisiblesParaEstudiante(@Param("usuarioId") Long usuarioId,
            @Param("materiaId") Long materiaId, @Param("q") String q);

    @Query("SELECT t FROM Tarea t JOIN Inscripcion i ON i.clase = t.clase WHERE i.usuario.id = :usuarioId "
            + "AND t.estado = com.aulix.aulix.entity.EstadoTarea.ACTIVA "
            + "AND t.fechaVencimiento >= :desde AND t.fechaVencimiento < :hasta ORDER BY t.fechaVencimiento ASC")
    List<Tarea> vencimientosEstudianteEnMes(@Param("usuarioId") Long usuarioId,
            @Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Query("SELECT t FROM Tarea t WHERE t.clase.docente.id = :docenteId "
            + "AND ((t.fechaActivacion >= :desde AND t.fechaActivacion < :hasta) "
            + "OR (t.fechaVencimiento >= :desde AND t.fechaVencimiento < :hasta)) ORDER BY t.fechaVencimiento ASC")
    List<Tarea> delDocenteEnMes(@Param("docenteId") Long docenteId,
            @Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}
