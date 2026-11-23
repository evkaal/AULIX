package com.aulix.aulix.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.aulix.aulix.dto.AuthResponse;
import com.aulix.aulix.dto.ChangePasswordRequest;
import com.aulix.aulix.dto.LoginRequest;
import com.aulix.aulix.dto.RegisterRequest;
import com.aulix.aulix.dto.UserResponse;
import com.aulix.aulix.entity.Usuario;
import com.aulix.aulix.repository.UsuarioRepository;
import com.aulix.aulix.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }
        Usuario usuario = Usuario.builder()
                .nombre(request.nombre())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .rol(request.rol())
                .grupo(request.grupo())
                .ciclo(request.ciclo() != null ? request.ciclo() : 2026)
                .activo(true)
                .build();
        usuarioRepository.save(usuario);
        String jwtToken = jwtService.generateToken(usuario);
        return new AuthResponse(jwtToken, UserResponse.of(usuario));
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));
        String jwtToken = jwtService.generateToken(usuario);
        return new AuthResponse(jwtToken, UserResponse.of(usuario));
    }

    /**
     * Cambia la contraseña del usuario autenticado. Exige la contraseña actual
     * (se verifica con BCrypt, nunca en texto plano) y guarda la nueva cifrada.
     * El token actual sigue funcionando: el JWT no depende de la contraseña.
     */
    public void changePassword(Usuario usuario, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.currentPassword(), usuario.getPassword())) {
            throw new IllegalArgumentException("La contraseña actual no es correcta");
        }
        if (passwordEncoder.matches(request.newPassword(), usuario.getPassword())) {
            throw new IllegalArgumentException("La nueva contraseña debe ser diferente de la actual");
        }
        usuario.setPassword(passwordEncoder.encode(request.newPassword()));
        usuarioRepository.save(usuario);
    }
}
