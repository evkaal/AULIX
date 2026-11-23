package com.aulix.aulix.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aulix.aulix.entity.Inscripcion;

public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {
    Optional<Inscripcion> findByUsuarioIdAndClaseId(Long usuarioId, Long claseId);
    boolean existsByUsuarioIdAndClaseId(Long usuarioId, Long claseId);
    List<Inscripcion> findByClaseIdOrderByUsuarioNombreAsc(Long claseId);
    List<Inscripcion> findByUsuarioId(Long usuarioId);
    long countByClaseId(Long claseId);

    @Query("SELECT i FROM Inscripcion i JOIN FETCH i.usuario WHERE i.clase.id = :claseId "
            + "AND (:q IS NULL OR LOWER(i.usuario.nombre) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(i.usuario.email) LIKE LOWER(CONCAT('%', :q, '%'))) "
            + "ORDER BY i.usuario.nombre ASC")
    List<Inscripcion> buscarPorClase(@Param("claseId") Long claseId, @Param("q") String q);
}
