package com.aulix.aulix.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aulix.aulix.entity.Entrega;
import com.aulix.aulix.entity.EstadoEntrega;

public interface EntregaRepository extends JpaRepository<Entrega, Long> {
    Optional<Entrega> findByTareaIdAndEstudianteId(Long tareaId, Long estudianteId);
    List<Entrega> findByTareaIdOrderByFechaEntregaDesc(Long tareaId);
    List<Entrega> findByEstudianteIdOrderByFechaEntregaDesc(Long estudianteId);
    List<Entrega> findByTareaClaseIdAndEstudianteId(Long claseId, Long estudianteId);
    long countByTareaId(Long tareaId);
    long countByTareaIdAndEstado(Long tareaId, EstadoEntrega estado);
    long countByTareaClaseId(Long claseId);

    @Query("SELECT e FROM Entrega e JOIN FETCH e.tarea t JOIN FETCH e.estudiante "
            + "WHERE t.clase.docente.id = :docenteId ORDER BY e.fechaEntrega DESC")
    List<Entrega> recientesDelDocente(@Param("docenteId") Long docenteId);

    @Query("SELECT e FROM Entrega e WHERE e.tarea.clase.id = :claseId AND e.estudiante.id = :alumnoId ORDER BY e.fechaEntrega DESC")
    List<Entrega> porClaseYAlumno(@Param("claseId") Long claseId, @Param("alumnoId") Long alumnoId);
}
