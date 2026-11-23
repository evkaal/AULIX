package com.aulix.aulix.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aulix.aulix.service.DashboardService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/docente/resumen")
    public ResponseEntity<Map<String, Object>> resumenDocente() {
        return ResponseEntity.ok(dashboardService.resumenDocente());
    }

    @GetMapping("/estudiante/resumen")
    public ResponseEntity<Map<String, Object>> resumenEstudiante() {
        return ResponseEntity.ok(dashboardService.resumenEstudiante());
    }
}
