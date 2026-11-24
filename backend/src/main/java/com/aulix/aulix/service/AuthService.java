package com.aulix.aulix.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.aulix.aulix.dto.AuthResponse;
import com.aulix.aulix.dto.ChangePasswordRequest;
import com.aulix.aulix.dto.LoginRequest;
import com.aulix.aulix.dto.RegisterRequest;
import com.aulix.aulix.dto.UserResponse;
import com.aulix.aulix.entity.Rol;
import com.aulix.aulix.entity.Usuario;
import com.aulix.aulix.repository.UsuarioRepository;
import com.aulix.aulix.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /** ID de cliente de OAuth de Google Cloud (ver application.properties).
     *  Sin él, el inicio con Google no está configurado. */
    @Value("${google.client-id:}")
    private String googleClientId;

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
     * Inicio de sesión con Google (flujo ID token de Google Identity
     * Services, sin client_secret). El frontend envía el ID token que
     * devuelve Google y aquí se verifica contra Google con el client ID
     * del servidor. Si el correo ya existe, entra con esa cuenta (con su
     * rol actual); si no existe, se crea como ESTUDIANTE. La contraseña
     * guardada es un UUID aleatorio cifrado con BCrypt: la columna es
     * NOT NULL, pero esa contraseña es inutilizable a propósito, así que
     * la cuenta solo puede entrar con Google hasta que un administrador
     * le asigne una contraseña.
     */
    public AuthResponse loginWithGoogle(String idToken) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalArgumentException("El inicio de sesión con Google no está configurado en el servidor");
        }
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
        GoogleIdToken googleIdToken;
        try {
            googleIdToken = verifier.verify(idToken);
        } catch (GeneralSecurityException | IOException e) {
            throw new IllegalArgumentException("Token de Google inválido");
        }
        if (googleIdToken == null) {
            throw new IllegalArgumentException("Token de Google inválido");
        }
        GoogleIdToken.Payload payload = googleIdToken.getPayload();
        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Token de Google inválido");
        }
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new IllegalArgumentException("Tu correo de Google no está verificado");
        }
        String nombre = (String) payload.get("name");
        if (nombre == null || nombre.isBlank()) {
            nombre = email.substring(0, email.indexOf('@'));
        }
        String foto = (String) payload.get("picture");

        Optional<Usuario> existente = usuarioRepository.findByEmail(email);
        Usuario usuario;
        if (existente.isPresent()) {
            usuario = existente.get();
            if (!usuario.isActivo()) {
                throw new IllegalArgumentException("Tu cuenta fue dada de baja. Pide a un administrador que la reactive.");
            }
        } else {
            usuario = Usuario.builder()
                    .nombre(nombre)
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .rol(Rol.ESTUDIANTE)
                    .grupo(null)
                    .ciclo(2026)
                    .activo(true)
                    .avatarUrl(foto)
                    .build();
            usuarioRepository.save(usuario);
        }
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
