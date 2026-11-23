package com.aulix.aulix.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aulix.aulix.entity.Recurso;

public interface RecursoRepository extends JpaRepository<Recurso, Long> {
    List<Recurso> findByClaseIdOrderByIdAsc(Long claseId);
    List<Recurso> findByTareaIdOrderByIdAsc(Long tareaId);
    List<Recurso> findByClaseIdOrTareaClaseId(Long claseId, Long claseId2);
}
