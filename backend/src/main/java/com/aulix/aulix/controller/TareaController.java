package com.aulix.aulix.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.aulix.aulix.dto.EntregaResponse;
import com.aulix.aulix.dto.ProgramacionRequest;
import com.aulix.aulix.dto.TareaRequest;
import com.aulix.aulix.dto.TareaResponse;
import com.aulix.aulix.service.EntregaService;
import com.aulix.aulix.service.TareaService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class TareaController {

    private final TareaService tareaService;
    private final EntregaService entregaService;

    @GetMapping("/api/tareas")
    public ResponseEntity<List<TareaResponse>> listarDocente(
            @RequestParam(required = false) Long materiaId,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(tareaService.listarDocente(materiaId, estado, q));
    }

    @GetMapping("/api/estudiante/tareas")
    public ResponseEntity<List<TareaResponse>> listarEstudiante(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long materiaId,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(tareaService.listarEstudiante(estado, materiaId, q));
    }

    @PostMapping("/api/tareas")
    public ResponseEntity<TareaResponse> crear(@Valid @RequestBody TareaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tareaService.crear(req));
    }

    @PutMapping("/api/tareas/{id}")
    public ResponseEntity<TareaResponse> actualizar(@PathVariable Long id, @Valid @RequestBody TareaRequest req) {
        return ResponseEntity.ok(tareaService.actualizar(id, req));
    }

    @DeleteMapping("/api/tareas/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        tareaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/tareas/{id}")
    public ResponseEntity<Map<String, Object>> detalle(@PathVariable Long id) {
        return ResponseEntity.ok(tareaService.detalle(id));
    }

    @PutMapping("/api/tareas/{id}/programacion")
    public ResponseEntity<TareaResponse> programacion(@PathVariable Long id, @RequestBody ProgramacionRequest req) {
        return ResponseEntity.ok(tareaService.actualizarProgramacion(id, req));
    }

    @PostMapping(value = "/api/tareas/{id}/entregas", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EntregaResponse> entregar(@PathVariable Long id,
            @RequestPart MultipartFile archivo,
            @RequestParam(required = false) String comentario,
            @RequestParam(required = false) Integer paginas) {
        return ResponseEntity.status(HttpStatus.CREATED).body(entregaService.entregar(id, archivo, comentario, paginas));
    }
}
