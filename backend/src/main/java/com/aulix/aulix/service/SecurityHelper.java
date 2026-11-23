package com.aulix.aulix.service;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.aulix.aulix.entity.Rol;
import com.aulix.aulix.entity.Usuario;
import com.aulix.aulix.repository.UsuarioRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/** Usuario autenticado (el email es el subject del JWT) y reglas de rol. */
@Component
@RequiredArgsConstructor
public class SecurityHelper {

    private final UsuarioRepository usuarioRepository;

    public Usuario actual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("No autenticado");
        }
        return usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }

    public Usuario exigirDocente() {
        Usuario u = actual();
        if (u.getRol() != Rol.DOCENTE) {
            throw new AccessDeniedException("Solo un docente puede hacer esto");
        }
        return u;
    }

    public Usuario exigirEstudiante() {
        Usuario u = actual();
        if (u.getRol() != Rol.ESTUDIANTE) {
            throw new AccessDeniedException("Solo un estudiante puede hacer esto");
        }
        return u;
    }
}
