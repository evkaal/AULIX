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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entrega de una tarea por un estudiante. Una sola por (tarea, estudiante):
 * si el alumno vuelve a entregar, se actualiza la misma fila. El comentario
 * es privado: solo lo ven el autor y el docente de la clase.
 * aTiempo = fechaEntrega <= fechaVencimiento de la tarea (se calcula, no se guarda).
 */
@Entity
@Table(name = "entregas",
        uniqueConstraints = @UniqueConstraint(columnNames = {"tarea_id", "estudiante_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Entrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarea_id", nullable = false)
    private Tarea tarea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Usuario estudiante;

    private String archivoNombre;

    /** Nombre único en ./uploads (nunca la ruta absoluta). */
    private String archivoRuta;

    private String archivoTipo;

    private Long archivoTamanoBytes;

    private Integer paginas;

    @Column(columnDefinition = "TEXT")
    private String comentario;

    @Default
    @Column(nullable = false)
    private LocalDateTime fechaEntrega = LocalDateTime.now();

    @Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoEntrega estado = EstadoEntrega.ENTREGADA;
}
