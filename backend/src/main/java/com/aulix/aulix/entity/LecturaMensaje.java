package com.aulix.aulix.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/** Marca de lectura de un mensaje por un usuario. Unica por (mensaje, usuario). */
@Entity
@Table(name = "lecturas_mensaje",
        uniqueConstraints = @UniqueConstraint(columnNames = {"mensaje_id", "usuario_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LecturaMensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mensaje_id", nullable = false)
    private Mensaje mensaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Default
    @Column(nullable = false)
    private LocalDateTime fechaLectura = LocalDateTime.now();
}
