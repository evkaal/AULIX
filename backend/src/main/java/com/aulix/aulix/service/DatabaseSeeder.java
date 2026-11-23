package com.aulix.aulix.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.aulix.aulix.entity.Anuncio;
import com.aulix.aulix.entity.Calificacion;
import com.aulix.aulix.entity.Clase;
import com.aulix.aulix.entity.Conversacion;
import com.aulix.aulix.entity.Entrega;
import com.aulix.aulix.entity.EstadoEntrega;
import com.aulix.aulix.entity.EstadoTarea;
import com.aulix.aulix.entity.Inscripcion;
import com.aulix.aulix.entity.Mensaje;
import com.aulix.aulix.entity.Recurso;
import com.aulix.aulix.entity.Rol;
import com.aulix.aulix.entity.Tarea;
import com.aulix.aulix.entity.TipoRecurso;
import com.aulix.aulix.entity.Usuario;
import com.aulix.aulix.repository.AnuncioRepository;
import com.aulix.aulix.repository.CalificacionRepository;
import com.aulix.aulix.repository.ClaseRepository;
import com.aulix.aulix.repository.ConversacionRepository;
import com.aulix.aulix.repository.EntregaRepository;
import com.aulix.aulix.repository.InscripcionRepository;
import com.aulix.aulix.repository.MensajeRepository;
import com.aulix.aulix.repository.RecursoRepository;
import com.aulix.aulix.repository.TareaRepository;
import com.aulix.aulix.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * Semilla de AULIX. Solo corre si la tabla usuarios esta vacia.
 * Fechas del Figma; "hoy" = 2026-10-21.
 *
 * DECISIONES (ver README):
 * - Lengua y Literatura queda en 3° B (como en la vista docente del Figma),
 *   aunque el Inicio del frontend la muestra junto a las de 3° A.
 * - Los totales del Figma (72/186 entregas etc.) son inconsistentes entre
 *   pantallas; la semilla es un subconjunto coherente: 28 alumnos en 3° A
 *   y 26 en 3° B, 9 tareas y unas pocas entregas con nota, para que los
 *   KPIs no sean cero pero los numeros cuadren.
 * - Los recursos con url /uploads/... son solo metadatos: no hay archivo
 *   real en ./uploads hasta que alguien suba uno.
 */
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ClaseRepository claseRepository;
    private final InscripcionRepository inscripcionRepository;
    private final TareaRepository tareaRepository;
    private final EntregaRepository entregaRepository;
    private final CalificacionRepository calificacionRepository;
    private final RecursoRepository recursoRepository;
    private final AnuncioRepository anuncioRepository;
    private final ConversacionRepository conversacionRepository;
    private final MensajeRepository mensajeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            return;
        }

        Usuario laura = usuario("Laura Martínez", "laura@colegio.edu", "Docente123*", Rol.DOCENTE, null);

        // 8 estudiantes con nombre del Figma (3° A).
        List<Usuario> grupoA = new ArrayList<>();
        grupoA.add(usuario("Ana Sofía García", "ana.sofia@colegio.edu", "Estudiante123*", Rol.ESTUDIANTE, "3° A"));
        grupoA.add(usuario("Bruno Hernández", "bruno.hernandez@colegio.edu", "Estudiante123*", Rol.ESTUDIANTE, "3° A"));
        grupoA.add(usuario("Camila López", "camila.lopez@colegio.edu", "Estudiante123*", Rol.ESTUDIANTE, "3° A"));
        grupoA.add(usuario("Daniel Pérez", "daniel.perez@colegio.edu", "Estudiante123*", Rol.ESTUDIANTE, "3° A"));
        grupoA.add(usuario("Elena Rodríguez", "elena.rodriguez@colegio.edu", "Estudiante123*", Rol.ESTUDIANTE, "3° A"));
        grupoA.add(usuario("Gabriel Sánchez", "gabriel.sanchez@colegio.edu", "Estudiante123*", Rol.ESTUDIANTE, "3° A"));
        grupoA.add(usuario("Isabella Torres", "isabella.torres@colegio.edu", "Estudiante123*", Rol.ESTUDIANTE, "3° A"));
        grupoA.add(usuario("Javier Ramírez", "javier.ramirez@colegio.edu", "Estudiante123*", Rol.ESTUDIANTE, "3° A"));
        // Genericos hasta 28 en 3° A.
        for (int i = 9; i <= 28; i++) {
            grupoA.add(usuario("Estudiante 3A " + String.format("%02d", i),
                    "estudiante-3a-" + String.format("%02d", i) + "@colegio.edu",
                    "Estudiante123*", Rol.ESTUDIANTE, "3° A"));
        }
        // 26 en 3° B (genericos).
        List<Usuario> grupoB = new ArrayList<>();
        for (int i = 1; i <= 26; i++) {
            grupoB.add(usuario("Estudiante 3B " + String.format("%02d", i),
                    "estudiante-3b-" + String.format("%02d", i) + "@colegio.edu",
                    "Estudiante123*", Rol.ESTUDIANTE, "3° B"));
        }

        Clase mat = clase("Matemáticas", "3° A", "LUN,MIE,VIE", LocalTime.of(8, 0), LocalTime.of(9, 0),
                "Aula 3", "blue", "x² + y²", "calculator", "MAT-3A-2026", laura);
        Clase cie = clase("Ciencias", "3° A", "MAR,JUE", LocalTime.of(9, 0), LocalTime.of(10, 0),
                "Aula 3", "green", "H₂O", "flask", "CIE-3A-2026", laura);
        Clase len = clase("Lengua y Literatura", "3° B", "LUN,MIE,VIE", LocalTime.of(10, 0), LocalTime.of(11, 0),
                "Aula 5", "purple", "Aa", "book", "LEN-3B-2026", laura);

        for (Usuario u : grupoA) {
            inscribir(u, mat);
            inscribir(u, cie);
        }
        for (Usuario u : grupoB) {
            inscribir(u, len);
        }

        // 9 tareas del Figma. Vencimientos 22-30 oct 2026, 23:59.
        Tarea ecuaciones = tarea(mat, "Ecuaciones de primer grado",
                "Resuelve las ecuaciones de la guía y sube tu trabajo en PDF.",
                "1. Descarga la guía. 2. Resuelve los 10 ejercicios. 3. Sube el PDF antes del vencimiento.",
                LocalDateTime.of(2026, 10, 19, 8, 0), LocalDateTime.of(2026, 10, 22, 23, 59), EstadoTarea.ACTIVA, laura);
        Tarea cicloAgua = tarea(cie, "El ciclo del agua",
                "Explica el ciclo del agua con un esquema.",
                "Dibuja o describe cada etapa del ciclo del agua.",
                LocalDateTime.of(2026, 10, 19, 8, 0), LocalDateTime.of(2026, 10, 23, 23, 59), EstadoTarea.ACTIVA, laura);
        Tarea resena = tarea(len, "Reseña de lectura",
                "Escribe una reseña del libro leído en clase.",
                "Mínimo 300 palabras: resumen, opinión y recomendación.",
                LocalDateTime.of(2026, 10, 19, 8, 0), LocalDateTime.of(2026, 10, 23, 23, 59), EstadoTarea.ACTIVA, laura);
        Tarea angulos = tarea(mat, "Ángulos y triángulos",
                "Clasifica ángulos y triángulos según sus medidas.",
                "Resuelve los ejercicios 1 al 8 de la página 42.",
                LocalDateTime.of(2026, 10, 20, 8, 0), LocalDateTime.of(2026, 10, 26, 23, 59), EstadoTarea.ACTIVA, laura);
        Tarea enteros = tarea(mat, "Operaciones con enteros",
                "Suma, resta, multiplicación y división con enteros.",
                "Resuelve la hoja de ejercicios y sube el resultado.",
                LocalDateTime.of(2026, 10, 20, 8, 0), LocalDateTime.of(2026, 10, 27, 23, 59), EstadoTarea.ACTIVA, laura);
        Tarea ecosistemas = tarea(cie, "Los ecosistemas",
                "Describe un ecosistema y sus componentes.",
                "Elige un ecosistema y describe productores, consumidores y descomponedores.",
                LocalDateTime.of(2026, 10, 20, 8, 0), LocalDateTime.of(2026, 10, 27, 23, 59), EstadoTarea.ACTIVA, laura);
        Tarea poema = tarea(len, "Análisis de un poema",
                "Analiza el poema trabajado en clase.",
                "Identifica tema, figuras retóricas y tu interpretación.",
                LocalDateTime.of(2026, 10, 21, 8, 0), LocalDateTime.of(2026, 10, 28, 23, 59), EstadoTarea.ACTIVA, laura);
        Tarea cuento = tarea(len, "Escritura de un cuento",
                "Escribe un cuento corto original.",
                "Mínimo 500 palabras, con inicio, desarrollo y final.",
                LocalDateTime.of(2026, 10, 21, 8, 0), LocalDateTime.of(2026, 10, 30, 23, 59), EstadoTarea.ACTIVA, laura);
        tarea(mat, "Problemas con fracciones",
                "Resuelve problemas con fracciones.",
                "Resuelve los 6 problemas de la guía.",
                LocalDateTime.of(2026, 10, 26, 8, 0), LocalDateTime.of(2026, 10, 28, 23, 59), EstadoTarea.PROGRAMADA, laura);

        Usuario ana = grupoA.get(0);
        Usuario bruno = grupoA.get(1);
        Usuario camila = grupoA.get(2);
        Usuario daniel = grupoA.get(3);
        Usuario elena = grupoA.get(4);
        Usuario gabriel = grupoA.get(5);

        // Entregas de ejemplo coherentes (Ana: las 3 del Figma).
        entregarCalificada(ecuaciones, ana, "Ecuaciones_Ana_Sofia.pdf", LocalDateTime.of(2026, 10, 21, 9, 20),
                new BigDecimal("9.0"), "Muy buen trabajo, Ana. Revisa el ejercicio 7.", laura);
        entregarCalificada(angulos, ana, "Angulos_Ana_Sofia.pdf", LocalDateTime.of(2026, 10, 20, 16, 45),
                new BigDecimal("9.0"), "Excelente clasificación.", laura);
        entregarCalificada(enteros, ana, "Enteros_Ana_Sofia.pdf", LocalDateTime.of(2026, 10, 19, 11, 10),
                new BigDecimal("8.0"), "Bien, cuida los signos en la resta.", laura);
        entregar(ecuaciones, bruno, "Ecuaciones_Bruno.pdf", LocalDateTime.of(2026, 10, 21, 10, 15));
        entregarCalificada(cicloAgua, camila, "Ciclo_del_agua_Camila.pdf", LocalDateTime.of(2026, 10, 22, 8, 30),
                new BigDecimal("8.5"), "Esquema muy claro.", laura);
        entregar(resena, daniel, "Resena_Daniel.pdf", LocalDateTime.of(2026, 10, 22, 17, 0));
        entregarCalificada(angulos, elena, "Angulos_Elena.pdf", LocalDateTime.of(2026, 10, 20, 18, 20),
                new BigDecimal("7.5"), "Bien, repasa los triángulos isósceles.", laura);
        entregar(ecosistemas, gabriel, "Ecosistemas_Gabriel.pdf", LocalDateTime.of(2026, 10, 24, 9, 0));

        // Materiales (metadatos; sin archivo real en ./uploads).
        recurso(mat, null, TipoRecurso.ARCHIVO, "Guía_ecuaciones.pdf", "/uploads/guia-ecuaciones.pdf", "application/pdf", 245760L, 12, null);
        recurso(cie, null, TipoRecurso.VIDEO, "El ciclo del agua (video)", "https://example.com/videos/el-ciclo-del-agua.mp4", null, null, null, 8);
        recurso(len, null, TipoRecurso.ARCHIVO, "Guía_reseña.pdf", "/uploads/guia-resena.pdf", "application/pdf", 180000L, 6, null);

        // 1 anuncio por clase.
        anuncio(mat, laura, "Recuerden: la tarea de Ecuaciones vence el 22 de octubre. La guía está en Materiales.");
        anuncio(cie, laura, "El jueves veremos los ecosistemas en el laboratorio. Traigan su cuaderno.");
        anuncio(len, laura, "La reseña de lectura se entrega el 23 de octubre. Mínimo 300 palabras.");

        // 1 conversación por clase con mensajes del 21 oct.
        conversacion(mat, laura, ana, bruno,
                "Hola a todos, subí la guía de ecuaciones a Materiales.",
                "Gracias, maestra. ¿El ejercicio 7 es con fracciones?",
                "Yo ya la descargué, está en PDF.",
                "El 7 es con enteros, Ana. Cualquier duda me escriben por aquí.");
        conversacion(cie, laura, ana, bruno,
                "Para mañana traigan el esquema del ciclo del agua.",
                "¿El esquema es a mano o digital?",
                "Yo lo haré digital, ¿se puede?",
                "Como prefieran, lo importante es que se vean las etapas.");
        conversacion(len, laura, ana, bruno,
                "La reseña debe tener mínimo 300 palabras.",
                "¿Puede ser del libro que elegimos nosotros?",
                "Sí, del libro que cada quien eligió.",
                "Perfecto, gracias.");
    }

    // ---------- Helpers ----------

    private Usuario usuario(String nombre, String email, String password, Rol rol, String grupo) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre).email(email).password(passwordEncoder.encode(password))
                .rol(rol).grupo(grupo).ciclo(2026).activo(true).build());
    }

    private Clase clase(String nombre, String grupo, String dias, LocalTime inicio, LocalTime fin,
            String aula, String tema, String simbolo, String icono, String codigo, Usuario docente) {
        return claseRepository.save(Clase.builder()
                .nombre(nombre).grupo(grupo).ciclo(2026).docente(docente)
                .diasSemana(dias).horaInicio(inicio).horaFin(fin).aula(aula)
                .tema(tema).simbolo(simbolo).icono(icono).codigoInvitacion(codigo).estado("EN_CURSO").build());
    }

    private void inscribir(Usuario u, Clase c) {
        inscripcionRepository.save(Inscripcion.builder().usuario(u).clase(c)
                .fechaInscripcion(LocalDateTime.of(2026, 10, 1, 8, 0)).build());
    }

    private Tarea tarea(Clase clase, String titulo, String descripcion, String instrucciones,
            LocalDateTime activacion, LocalDateTime vencimiento, EstadoTarea estado, Usuario autor) {
        return tareaRepository.save(Tarea.builder()
                .clase(clase).titulo(titulo).descripcion(descripcion).instrucciones(instrucciones)
                .fechaPublicacion(LocalDateTime.of(2026, 10, 19, 8, 0))
                .fechaActivacion(activacion).fechaVencimiento(vencimiento)
                .activacionAutomatica(true).estado(estado).autor(autor).build());
    }

    private Entrega entregar(Tarea tarea, Usuario estudiante, String archivo, LocalDateTime fecha) {
        // archivoRuta = null: la semilla no incluye el archivo real en ./uploads,
        // solo el nombre que el alumno "subió". La descarga de una entrega
        // sembrada devuelve 404 hasta que el alumno entregue de verdad.
        return entregaRepository.save(Entrega.builder()
                .tarea(tarea).estudiante(estudiante)
                .archivoNombre(archivo).archivoRuta(null).archivoTipo("application/pdf")
                .archivoTamanoBytes(120000L).paginas(3)
                .comentario("Aquí está mi tarea.")
                .fechaEntrega(fecha).estado(EstadoEntrega.ENTREGADA).build());
    }

    private void entregarCalificada(Tarea tarea, Usuario estudiante, String archivo, LocalDateTime fecha,
            BigDecimal nota, String comentarioDocente, Usuario docente) {
        Entrega entrega = entregar(tarea, estudiante, archivo, fecha);
        entrega.setEstado(EstadoEntrega.CALIFICADA);
        entregaRepository.save(entrega);
        calificacionRepository.save(Calificacion.builder()
                .entrega(entrega).nota(nota).comentario(comentarioDocente).docente(docente)
                .fechaCalificacion(fecha.plusDays(1)).build());
    }

    private void recurso(Clase clase, Tarea tarea, TipoRecurso tipo, String nombre, String url,
            String mime, Long tamano, Integer paginas, Integer duracionMin) {
        recursoRepository.save(Recurso.builder()
                .clase(clase).tarea(tarea).tipo(tipo).nombre(nombre).url(url)
                .mime(mime).tamanoBytes(tamano).paginas(paginas).duracionMin(duracionMin).build());
    }

    private void anuncio(Clase clase, Usuario autor, String texto) {
        anuncioRepository.save(Anuncio.builder().clase(clase).autor(autor).texto(texto)
                .createdAt(LocalDateTime.of(2026, 10, 21, 8, 0)).build());
    }

    private void conversacion(Clase clase, Usuario laura, Usuario ana, Usuario bruno,
            String m1, String m2, String m3, String m4) {
        Conversacion conv = conversacionRepository.save(Conversacion.builder().clase(clase).build());
        mensaje(conv, laura, m1, LocalDateTime.of(2026, 10, 21, 9, 0));
        mensaje(conv, ana, m2, LocalDateTime.of(2026, 10, 21, 9, 24));
        mensaje(conv, bruno, m3, LocalDateTime.of(2026, 10, 21, 9, 31));
        mensaje(conv, laura, m4, LocalDateTime.of(2026, 10, 21, 9, 35));
    }

    private Mensaje mensaje(Conversacion conv, Usuario autor, String texto, LocalDateTime fecha) {
        return mensajeRepository.save(Mensaje.builder()
                .conversacion(conv).autor(autor).texto(texto).fechaEnvio(fecha).build());
    }
}
