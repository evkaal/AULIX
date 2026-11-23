package com.aulix.aulix.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aulix.aulix.entity.Clase;
import com.aulix.aulix.entity.Usuario;

public interface ClaseRepository extends JpaRepository<Clase, Long> {
    List<Clase> findByDocenteOrderByNombreAsc(Usuario docente);
    List<Clase> findByDocenteIdOrderByNombreAsc(Long docenteId);
    Optional<Clase> findByCodigoInvitacion(String codigo);
    boolean existsByCodigoInvitacion(String codigo);

    @Query("SELECT c FROM Clase c WHERE c.docente.id = :docenteId AND (:ciclo IS NULL OR c.ciclo = :ciclo) "
            + "AND (:q IS NULL OR LOWER(c.nombre) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(c.grupo) LIKE LOWER(CONCAT('%', :q, '%'))) "
            + "ORDER BY c.nombre ASC")
    List<Clase> buscarDelDocente(@Param("docenteId") Long docenteId, @Param("ciclo") Integer ciclo, @Param("q") String q);

    @Query("SELECT c FROM Clase c JOIN Inscripcion i ON i.clase = c WHERE i.usuario.id = :usuarioId "
            + "AND (:ciclo IS NULL OR c.ciclo = :ciclo) "
            + "AND (:q IS NULL OR LOWER(c.nombre) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(c.grupo) LIKE LOWER(CONCAT('%', :q, '%'))) "
            + "ORDER BY c.nombre ASC")
    List<Clase> buscarInscritas(@Param("usuarioId") Long usuarioId, @Param("ciclo") Integer ciclo, @Param("q") String q);
}
