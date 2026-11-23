package com.aulix.aulix.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.aulix.aulix.entity.EstadoTarea;
import com.aulix.aulix.entity.Tarea;
import com.aulix.aulix.repository.TareaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Cada minuto activa las tareas PROGRAMADA cuya fechaActivacion ya llego.
 * Decision documentada (ver README): se activan todas las que llegaron a
 * su fecha, con activacionAutomatica true o false, porque no existe un
 * endpoint de activacion manual y una tarea con activacionAutomatica=false
 * quedaria atascada en PROGRAMADA para siempre. Las tareas NO se cierran
 * solas al vencer: CERRADA solo la pone el docente.
 */
@Component
@RequiredArgsConstructor
public class TareaScheduler {

    private final TareaRepository tareaRepository;

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void activarTareasProgramadas() {
        List<Tarea> pendientes = tareaRepository.findByEstadoAndFechaActivacionLessThanEqual(
                EstadoTarea.PROGRAMADA, LocalDateTime.now());
        for (Tarea t : pendientes) {
            t.setEstado(EstadoTarea.ACTIVA);
            tareaRepository.save(t);
        }
    }
}
