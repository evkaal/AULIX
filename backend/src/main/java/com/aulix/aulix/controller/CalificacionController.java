package com.aulix.aulix.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aulix.aulix.dto.CalificacionRequest;
import com.aulix.aulix.dto.CalificacionResponse;
import com.aulix.aulix.service.CalificacionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class CalificacionController {

    private final CalificacionService calificacionService;

    @PostMapping("/api/entregas/{id}/calificacion")
    public ResponseEntity<CalificacionResponse> calificar(@PathVariable Long id,
            @Valid @RequestBody CalificacionRequest req) {
        return ResponseEntity.ok(calificacionService.calificar(id, req));
    }

    @PutMapping("/api/entregas/{id}/calificacion")
    public ResponseEntity<CalificacionResponse> actualizarCalificacion(@PathVariable Long id,
            @Valid @RequestBody CalificacionRequest req) {
        return ResponseEntity.ok(calificacionService.calificar(id, req));
    }

    @GetMapping("/api/calificaciones/resumen")
    public ResponseEntity<Map<String, Object>> resumenDocente() {
        return ResponseEntity.ok(calificacionService.resumenDocente());
    }

    @GetMapping("/api/clases/{id}/calificaciones/resumen")
    public ResponseEntity<Map<String, Object>> resumenPorClase(@PathVariable Long id) {
        return ResponseEntity.ok(calificacionService.resumenPorClase(id));
    }

    @GetMapping("/api/estudiante/calificaciones")
    public ResponseEntity<List<CalificacionResponse>> calificacionesEstudiante(
            @RequestParam(required = false) Long materiaId) {
        return ResponseEntity.ok(calificacionService.calificacionesEstudiante(materiaId));
    }

    @GetMapping("/api/calificaciones/exportar")
    public ResponseEntity<String> exportar(
            @RequestParam(required = false) Long materiaId,
            @RequestParam(required = false) Integer ciclo) {
        String csv = calificacionService.exportarCsv(materiaId, ciclo);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"calificaciones.csv\"")
                .body(csv);
    }
}
