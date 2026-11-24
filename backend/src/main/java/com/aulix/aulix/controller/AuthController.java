package com.aulix.aulix.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aulix.aulix.dto.AuthResponse;
import com.aulix.aulix.dto.ChangePasswordRequest;
import com.aulix.aulix.dto.GoogleLoginRequest;
import com.aulix.aulix.dto.LoginRequest;
import com.aulix.aulix.dto.RegisterRequest;
import com.aulix.aulix.dto.UserResponse;
import com.aulix.aulix.service.AuthService;
import com.aulix.aulix.service.SecurityHelper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityHelper security;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Inicio de sesión con Google: recibe el ID token de Google Identity
     *  Services y devuelve { token, user } igual que el login normal.
     *  Queda público por /api/auth/** en SecurityConfig. */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request.idToken()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(UserResponse.of(security.actual()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(security.actual(), request);
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada"));
    }
}
