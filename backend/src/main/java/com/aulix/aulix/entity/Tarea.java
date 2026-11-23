package com.aulix.aulix.entity;

import java.time.LocalDateTime;

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
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Tarea de una clase. PROGRAMADA es invisible para los estudiantes hasta
 * fechaActivacion; el scheduler la pasa a ACTIVA. Las tareas NO se cierran
 * solas al vencer: CERRADA solo la pone el docente.
 */
@Entity
@Table(name = "tareas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clase_id", nullable = false)
    private Clase clase;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(columnDefinition = "TEXT")
    private String instrucciones;

    @Default
    @Column(nullable = false)
    private LocalDateTime fechaPublicacion = LocalDateTime.now();

    private LocalDateTime fechaActivacion;

    private LocalDateTime fechaVencimiento;

    @Default
    @Column(nullable = false)
    private boolean activacionAutomatica = true;

    @Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoTarea estado = EstadoTarea.ACTIVA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;
}
