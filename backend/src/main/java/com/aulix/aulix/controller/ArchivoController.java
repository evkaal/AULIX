package com.aulix.aulix.controller;

import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.aulix.aulix.service.ArchivoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/archivos")
@RequiredArgsConstructor
public class ArchivoController {

    private final ArchivoService archivoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> subir(@RequestPart MultipartFile archivo) {
        String guardado = archivoService.guardar(archivo);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "nombre", archivo.getOriginalFilename(),
                "ruta", "/uploads/" + guardado,
                "archivoRuta", guardado,
                "tipo", archivo.getContentType(),
                "tamanoBytes", archivo.getSize()));
    }

    @GetMapping("/{nombre}")
    public ResponseEntity<Resource> descargar(@PathVariable String nombre) {
        Resource recurso = archivoService.cargar(nombre);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombre + "\"")
                .body(recurso);
    }
}
