package com.aulix.aulix.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aulix.aulix.entity.Anuncio;

public interface AnuncioRepository extends JpaRepository<Anuncio, Long> {
    List<Anuncio> findByClaseIdOrderByCreatedAtDesc(Long claseId);
}
