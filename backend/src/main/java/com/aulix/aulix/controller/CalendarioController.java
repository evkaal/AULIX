package com.aulix.aulix.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aulix.aulix.service.CalendarioService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CalendarioController {

    private final CalendarioService calendarioService;

    @GetMapping("/calendario")
    public ResponseEntity<Map<String, Object>> calendarioDocente(
            @RequestParam(required = false) String mes,
            @RequestParam(required = false) Long materiaId) {
        return ResponseEntity.ok(calendarioService.calendarioDocente(mes, materiaId));
    }

    @GetMapping("/estudiante/calendario")
    public ResponseEntity<Map<String, Object>> calendarioEstudiante(
            @RequestParam(required = false) String mes) {
        return ResponseEntity.ok(calendarioService.calendarioEstudiante(mes));
    }
}
