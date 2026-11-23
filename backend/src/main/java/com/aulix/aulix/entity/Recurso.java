package com.aulix.aulix.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Recurso: material de una clase (tarea null) o de una tarea concreta
 * (clase null o igual a la de la tarea). ARCHIVO = ruta local /uploads/...,
 * VIDEO = URL externa. Los campos de archivo son solo metadatos.
 */
@Entity
@Table(name = "recursos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recurso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarea_id")
    private Tarea tarea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clase_id")
    private Clase clase;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoRecurso tipo;

    @Column(nullable = false)
    private String nombre;

    /** Ruta local (/uploads/...) o URL del video. Nunca la ruta absoluta. */
    @Column(nullable = false)
    private String url;

    private String mime;

    private Long tamanoBytes;

    private Integer paginas;

    private Integer duracionMin;
}
