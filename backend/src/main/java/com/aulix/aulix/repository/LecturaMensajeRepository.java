package com.aulix.aulix.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aulix.aulix.entity.LecturaMensaje;

public interface LecturaMensajeRepository extends JpaRepository<LecturaMensaje, Long> {
    boolean existsByMensajeIdAndUsuarioId(Long mensajeId, Long usuarioId);
    List<LecturaMensaje> findByUsuarioId(Long usuarioId);
}
