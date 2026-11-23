package com.aulix.aulix.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityNotFoundException;

/**
 * Guarda archivos subidos en ./uploads (aulix.upload-dir) con un nombre unico.
 * Solo PDF, DOCX/DOC e imagenes. Nunca se devuelve la ruta absoluta:
 * las respuestas solo llevan el nombre guardado (archivoRuta) y la URL
 * de descarga /api/archivos/{nombre} o /api/entregas/{id}/archivo.
 */
@Service
public class ArchivoService {

    private static final Set<String> EXTENSIONES = Set.of("pdf", "docx", "doc", "png", "jpg", "jpeg", "webp", "gif");
    private static final long MAX_BYTES = 20L * 1024 * 1024;

    private final Path uploadDir;

    public ArchivoService(@Value("${aulix.upload-dir:./uploads}") String uploadDir) throws IOException {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDir);
    }

    public String guardar(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException("No se envió ningún archivo");
        }
        if (archivo.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("El archivo supera el tamaño máximo de 20 MB");
        }
        String original = archivo.getOriginalFilename() == null ? "archivo" : archivo.getOriginalFilename();
        String ext = extensionDe(original);
        if (!EXTENSIONES.contains(ext)) {
            throw new IllegalArgumentException("Tipo de archivo no permitido. Solo PDF, DOCX o imagen");
        }
        String nombreGuardado = UUID.randomUUID() + "." + ext;
        try {
            Files.copy(archivo.getInputStream(), uploadDir.resolve(nombreGuardado), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalArgumentException("No se pudo guardar el archivo");
        }
        return nombreGuardado;
    }

    public Resource cargar(String nombreGuardado) {
        try {
            Path archivo = uploadDir.resolve(nombreGuardado).normalize();
            if (!archivo.startsWith(uploadDir) || !Files.exists(archivo)) {
                throw new EntityNotFoundException("Archivo no encontrado");
            }
            return new UrlResource(archivo.toUri());
        } catch (Exception e) {
            throw new EntityNotFoundException("Archivo no encontrado");
        }
    }

    public static String extensionDe(String nombre) {
        int i = nombre.lastIndexOf('.');
        return i < 0 ? "" : nombre.substring(i + 1).toLowerCase();
    }
}
