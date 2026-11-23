package com.aulix.aulix.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aulix.aulix.entity.Rol;
import com.aulix.aulix.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Usuario> findByRolAndGrupo(Rol rol, String grupo);
    List<Usuario> findByRol(Rol rol);
}
