package com.aulix.aulix.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aulix.aulix.entity.Mensaje;

public interface MensajeRepository extends JpaRepository<Mensaje, Long> {
    Page<Mensaje> findByConversacionIdOrderByFechaEnvioDesc(Long conversacionId, Pageable pageable);
    List<Mensaje> findByConversacionIdOrderByFechaEnvioDesc(Long conversacionId);
    List<Mensaje> findByConversacionClaseIdOrderByFechaEnvioDesc(Long claseId);

    @Query("SELECT m FROM Mensaje m WHERE m.conversacion.id = :convId ORDER BY m.fechaEnvio DESC")
    List<Mensaje> ultimosDeConversacion(@Param("convId") Long convId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM Mensaje m WHERE m.conversacion.clase.id = :claseId "
            + "AND m.autor.id <> :usuarioId AND NOT EXISTS "
            + "(SELECT l FROM LecturaMensaje l WHERE l.mensaje = m AND l.usuario.id = :usuarioId)")
    long contarSinLeer(@Param("claseId") Long claseId, @Param("usuarioId") Long usuarioId);

    @Query("SELECT m FROM Mensaje m WHERE m.conversacion.clase.id = :claseId "
            + "AND m.autor.id <> :usuarioId AND NOT EXISTS "
            + "(SELECT l FROM LecturaMensaje l WHERE l.mensaje = m AND l.usuario.id = :usuarioId) "
            + "ORDER BY m.fechaEnvio DESC")
    List<Mensaje> sinLeerPorClase(@Param("claseId") Long claseId, @Param("usuarioId") Long usuarioId);

    List<Mensaje> findByConversacionClaseIdAndAdjuntoRutaIsNotNullOrderByFechaEnvioDesc(Long claseId);
}
