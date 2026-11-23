package com.aulix.aulix.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Calificación de una entrega (una por entrega). Al crearla, la entrega
 * pasa a CALIFICADA. Solo el docente de la clase puede crearla/editarla;
 * el estudiante nunca edita nota ni comentario.
 */
@Entity
@Table(name = "calificaciones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Calificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrega_id", nullable = false, unique = true)
    private Entrega entrega;

    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal nota;

    @Column(columnDefinition = "TEXT")
    private String comentario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "docente_id", nullable = false)
    private Usuario docente;

    @Default
    @Column(nullable = false)
    private LocalDateTime fechaCalificacion = LocalDateTime.now();
}
