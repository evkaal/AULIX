package com.aulix.aulix.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aulix.aulix.entity.Conversacion;

public interface ConversacionRepository extends JpaRepository<Conversacion, Long> {
    Optional<Conversacion> findByClaseId(Long claseId);
}
