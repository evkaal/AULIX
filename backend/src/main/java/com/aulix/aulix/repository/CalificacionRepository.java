package com.aulix.aulix.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aulix.aulix.entity.Calificacion;

public interface CalificacionRepository extends JpaRepository<Calificacion, Long> {
    Optional<Calificacion> findByEntregaId(Long entregaId);

    @Query("SELECT c FROM Calificacion c JOIN FETCH c.entrega e JOIN FETCH e.tarea t "
            + "WHERE t.clase.docente.id = :docenteId ORDER BY c.fechaCalificacion DESC")
    List<Calificacion> delDocente(@Param("docenteId") Long docenteId);

    @Query("SELECT c FROM Calificacion c JOIN FETCH c.entrega e JOIN FETCH e.tarea t "
            + "WHERE e.estudiante.id = :estudianteId "
            + "AND (:materiaId IS NULL OR t.clase.id = :materiaId) ORDER BY c.fechaCalificacion DESC")
    List<Calificacion> delEstudiante(@Param("estudianteId") Long estudianteId, @Param("materiaId") Long materiaId);

    @Query("SELECT AVG(c.nota) FROM Calificacion c JOIN c.entrega e WHERE e.estudiante.id = :estudianteId AND e.tarea.clase.id = :claseId")
    Double promedioPorAlumnoYClase(@Param("estudianteId") Long estudianteId, @Param("claseId") Long claseId);
}
