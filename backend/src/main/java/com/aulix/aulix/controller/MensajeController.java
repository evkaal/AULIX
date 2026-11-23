package com.aulix.aulix.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.aulix.aulix.dto.MensajeResponse;
import com.aulix.aulix.service.MensajeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/mensajes")
@RequiredArgsConstructor
public class MensajeController {

    private final MensajeService mensajeService;

    @GetMapping("/conversaciones")
    public ResponseEntity<List<Map<String, Object>>> conversaciones(
            @RequestParam(required = false) String filtro,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(mensajeService.conversaciones(filtro, q));
    }

    @GetMapping("/conversaciones/{claseId}/mensajes")
    public ResponseEntity<Page<MensajeResponse>> mensajes(@PathVariable Long claseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(mensajeService.mensajes(claseId, page, size));
    }

    @PostMapping(value = "/conversaciones/{claseId}/mensajes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MensajeResponse> enviar(@PathVariable Long claseId,
            @RequestPart String texto,
            @RequestPart(required = false) MultipartFile adjunto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mensajeService.enviar(claseId, texto, adjunto));
    }

    @PostMapping("/conversaciones/{claseId}/leido")
    public ResponseEntity<Map<String, Object>> marcarLeido(@PathVariable Long claseId) {
        return ResponseEntity.ok(mensajeService.marcarLeido(claseId));
    }

    @GetMapping("/conversaciones/{claseId}/archivos")
    public ResponseEntity<List<Map<String, Object>>> archivos(@PathVariable Long claseId) {
        return ResponseEntity.ok(mensajeService.archivos(claseId));
    }

    @GetMapping("/sin-leer")
    public ResponseEntity<Map<String, Object>> sinLeer() {
        return ResponseEntity.ok(mensajeService.sinLeerTotal());
    }
}
