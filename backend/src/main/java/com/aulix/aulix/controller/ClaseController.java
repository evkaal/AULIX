package com.aulix.aulix.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
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

import com.aulix.aulix.dto.AnuncioRequest;
import com.aulix.aulix.dto.AnuncioResponse;
import com.aulix.aulix.dto.ClaseRequest;
import com.aulix.aulix.dto.ClaseResponse;
import com.aulix.aulix.dto.RecursoResponse;
import com.aulix.aulix.dto.TareaResponse;
import com.aulix.aulix.dto.UnirseRequest;
import com.aulix.aulix.service.ClaseService;
import com.aulix.aulix.service.EntregaService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/clases")
@RequiredArgsConstructor
public class ClaseController {

    private final ClaseService claseService;
    private final EntregaService entregaService;

    @GetMapping
    public ResponseEntity<List<ClaseResponse>> listar(
            @RequestParam(required = false) Integer ciclo,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(claseService.listar(ciclo, q));
    }

    @PostMapping
    public ResponseEntity<ClaseResponse> crear(@Valid @RequestBody ClaseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(claseService.crear(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClaseResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(claseService.obtener(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClaseResponse> actualizar(@PathVariable Long id, @Valid @RequestBody ClaseRequest req) {
        return ResponseEntity.ok(claseService.actualizar(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        claseService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/unirse")
    public ResponseEntity<ClaseResponse> unirse(@Valid @RequestBody UnirseRequest req) {
        return ResponseEntity.ok(claseService.unirse(req));
    }

    @GetMapping("/{id}/alumnos")
    public ResponseEntity<Page<Map<String, Object>>> alumnos(@PathVariable Long id,
            @RequestParam(required = false) String filtro,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(claseService.alumnos(id, filtro, q, page, size));
    }

    @GetMapping("/{id}/materiales")
    public ResponseEntity<List<RecursoResponse>> materiales(@PathVariable Long id) {
        return ResponseEntity.ok(claseService.materiales(id));
    }

    @PostMapping(value = "/{id}/materiales", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecursoResponse> subirMaterial(@PathVariable Long id,
            @RequestPart(required = false) MultipartFile archivo,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String url,
            @RequestParam(required = false) Integer duracionMin) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(claseService.subirMaterial(id, archivo, tipo, nombre, url, duracionMin));
    }

    @GetMapping("/{id}/anuncios")
    public ResponseEntity<List<AnuncioResponse>> anuncios(@PathVariable Long id) {
        return ResponseEntity.ok(claseService.anuncios(id));
    }

    @PostMapping("/{id}/anuncios")
    public ResponseEntity<AnuncioResponse> crearAnuncio(@PathVariable Long id, @Valid @RequestBody AnuncioRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(claseService.crearAnuncio(id, req));
    }

    @GetMapping("/{id}/mis-tareas")
    public ResponseEntity<List<TareaResponse>> misTareas(@PathVariable Long id) {
        return ResponseEntity.ok(claseService.misTareas(id));
    }

    @GetMapping("/{id}/mi-progreso")
    public ResponseEntity<Map<String, Object>> miProgreso(@PathVariable Long id) {
        return ResponseEntity.ok(claseService.miProgreso(id));
    }

    @GetMapping("/{id}/alumnos/{alumnoId}/entregas")
    public ResponseEntity<List<com.aulix.aulix.dto.EntregaResponse>> entregasDeAlumno(
            @PathVariable Long id, @PathVariable Long alumnoId) {
        return ResponseEntity.ok(entregaService.entregasDeAlumnoEnClase(id, alumnoId));
    }
}
