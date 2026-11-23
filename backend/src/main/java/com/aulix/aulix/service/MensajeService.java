package com.aulix.aulix.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.aulix.aulix.dto.MensajeResponse;
import com.aulix.aulix.entity.Conversacion;
import com.aulix.aulix.entity.LecturaMensaje;
import com.aulix.aulix.entity.Mensaje;
import com.aulix.aulix.entity.Usuario;
import com.aulix.aulix.repository.ConversacionRepository;
import com.aulix.aulix.repository.LecturaMensajeRepository;
import com.aulix.aulix.repository.MensajeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MensajeService {

    private final ConversacionRepository conversacionRepository;
    private final MensajeRepository mensajeRepository;
    private final LecturaMensajeRepository lecturaRepository;
    private final ClaseService claseService;
    private final ArchivoService archivoService;
    private final SecurityHelper security;

    /** Una conversación por clase; se crea la primera vez que se usa. */
    @Transactional
    public Conversacion conversacionDe(Long claseId) {
        claseService.exigirAcceso(claseId);
        return conversacionRepository.findByClaseId(claseId)
                .orElseGet(() -> conversacionRepository.save(
                        Conversacion.builder().clase(claseService.claseOr404(claseId)).build()));
    }

    /** Conversaciones del usuario: una por materia, con último mensaje y sinLeer. */
    public List<Map<String, Object>> conversaciones(String filtro, String q) {
        Usuario u = security.actual();
        List<Map<String, Object>> out = new ArrayList<>();
        for (var clase : claseService.listar(null, null)) {
            Long claseId = clase.id();
            if (q != null && !q.isBlank()
                    && !clase.nombre().toLowerCase().contains(q.toLowerCase())) {
                continue;
            }
            long sinLeer = mensajeRepository.contarSinLeer(claseId, u.getId());
            if ("sin-leer".equalsIgnoreCase(filtro) && sinLeer == 0) {
                continue;
            }
            var ultimo = mensajeRepository.findByConversacionClaseIdOrderByFechaEnvioDesc(claseId);
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("claseId", claseId);
            fila.put("claseNombre", clase.nombre());
            fila.put("grupo", clase.grupo());
            fila.put("tema", clase.tema());
            fila.put("sinLeer", sinLeer);
            fila.put("ultimoMensaje", ultimo.isEmpty() ? null : MensajeResponse.of(ultimo.get(0)));
            out.add(fila);
        }
        return out;
    }

    public Page<MensajeResponse> mensajes(Long claseId, int page, int size) {
        Conversacion conv = conversacionDe(claseId);
        Pageable pageable = PageRequest.of(page, size);
        Page<Mensaje> mensajes = mensajeRepository.findByConversacionIdOrderByFechaEnvioDesc(conv.getId(), pageable);
        return mensajes.map(MensajeResponse::of);
    }

    @Transactional
    public MensajeResponse enviar(Long claseId, String texto, MultipartFile adjunto) {
        Usuario autor = security.actual();
        Conversacion conv = conversacionDe(claseId);
        Mensaje.MensajeBuilder b = Mensaje.builder().conversacion(conv).autor(autor).texto(texto);
        if (adjunto != null && !adjunto.isEmpty()) {
            String guardado = archivoService.guardar(adjunto);
            b.adjuntoNombre(adjunto.getOriginalFilename()).adjuntoRuta(guardado)
                    .adjuntoTamanoBytes(adjunto.getSize());
        }
        Mensaje mensaje = mensajeRepository.save(b.build());
        // El autor ya "leyó" su propio mensaje.
        lecturaRepository.save(LecturaMensaje.builder().mensaje(mensaje).usuario(autor).build());
        return MensajeResponse.of(mensaje);
    }

    @Transactional
    public Map<String, Object> marcarLeido(Long claseId) {
        Usuario u = security.actual();
        Conversacion conv = conversacionDe(claseId);
        List<Mensaje> sinLeer = mensajeRepository.sinLeerPorClase(claseId, u.getId());
        for (Mensaje m : sinLeer) {
            lecturaRepository.save(LecturaMensaje.builder().mensaje(m).usuario(u).build());
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("claseId", claseId);
        out.put("marcados", sinLeer.size());
        return out;
    }

    /** Archivos compartidos en la conversación (mensajes con adjunto). */
    public List<Map<String, Object>> archivos(Long claseId) {
        conversacionDe(claseId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Mensaje m : mensajeRepository.findByConversacionClaseIdAndAdjuntoRutaIsNotNullOrderByFechaEnvioDesc(claseId)) {
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("mensajeId", m.getId());
            fila.put("nombre", m.getAdjuntoNombre());
            fila.put("ruta", m.getAdjuntoRuta());
            fila.put("tamanoBytes", m.getAdjuntoTamanoBytes());
            fila.put("autor", m.getAutor().getNombre());
            fila.put("fechaEnvio", m.getFechaEnvio());
            out.add(fila);
        }
        return out;
    }

    public Map<String, Object> sinLeerTotal() {
        Usuario u = security.actual();
        long total = 0;
        List<Map<String, Object>> porClase = new ArrayList<>();
        for (var clase : claseService.listar(null, null)) {
            long n = mensajeRepository.contarSinLeer(clase.id(), u.getId());
            total += n;
            if (n > 0) {
                Map<String, Object> fila = new LinkedHashMap<>();
                fila.put("claseId", clase.id());
                fila.put("claseNombre", clase.nombre());
                fila.put("sinLeer", n);
                porClase.add(fila);
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalSinLeer", total);
        out.put("porClase", porClase);
        return out;
    }
}
