package com.aulix.aulix.dto;

import com.aulix.aulix.entity.Rol;
import com.aulix.aulix.entity.Usuario;

/** Lo que el frontend espera en user: id, nombre, correo, rol, grupo, avatar, telefono. Sin password. */
public record UserResponse(Long id, String nombre, String correo, Rol rol, String grupo, Integer ciclo, String avatar, String telefono) {
    public static UserResponse of(Usuario u) {
        return new UserResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol(), u.getGrupo(), u.getCiclo(), u.getAvatarUrl(), u.getTelefono());
    }
}
