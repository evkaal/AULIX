package com.aulix.aulix.controller;

import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aulix.aulix.dto.EntregaResponse;
import com.aulix.aulix.service.EntregaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/entregas")
@RequiredArgsConstructor
public class EntregaController {

    private final EntregaService entregaService;

    @GetMapping("/{id}")
    public ResponseEntity<EntregaResponse> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(entregaService.obtener(id));
    }

    @GetMapping("/{id}/archivo")
    public ResponseEntity<Resource> descargar(@PathVariable Long id) {
        Resource recurso = entregaService.descargarArchivo(id);
        String nombre = entregaService.nombreArchivo(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombre + "\"")
                .body(recurso);
    }

    @GetMapping("/{id}/revision")
    public ResponseEntity<Map<String, Object>> revision(@PathVariable Long id) {
        return ResponseEntity.ok(entregaService.revision(id));
    }
}
