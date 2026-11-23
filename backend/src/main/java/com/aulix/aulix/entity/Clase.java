package com.aulix.aulix.entity;

import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Clase (materia + grupo), ej. Matemáticas 3° A. La crea un docente y es suya:
 * solo ese docente la gestiona. El codigo de invitación lo genera el backend.
 * tema = color del frontend (blue/green/purple); simbolo = fórmula que se
 * muestra en la tarjeta (x² + y², H₂O, Aa); icono = nombre del icono del
 * frontend (calculator/flask/book).
 */
@Entity
@Table(name = "clases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Clase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String grupo;

    @Default
    @Column(nullable = false)
    private Integer ciclo = 2026;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "docente_id", nullable = false)
    private Usuario docente;

    /** Días de la semana separados por coma, ej. "LUN,MIE,VIE". */
    private String diasSemana;

    private LocalTime horaInicio;

    private LocalTime horaFin;

    private String aula;

    private String tema;

    private String simbolo;

    private String icono;

    @Column(nullable = false, unique = true)
    private String codigoInvitacion;

    /** Estado de la clase. Por ahora siempre "EN_CURSO". */
    @Default
    @Column(nullable = false)
    private String estado = "EN_CURSO";
}
