package com.aulix.aulix.service;

import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Fachada de correo: el resto del código (AuthService, AuthController)
 * solo conoce esta clase. El envío real lo hace el {@link EmailSender}
 * activo según {@code aulix.email.proveedor}: Postfix local por defecto,
 * Resend como respaldo. Cambiar de proveedor no toca este archivo.
 *
 * El correo de bienvenida NUNCA incluye la contraseña y NUNCA hace
 * fallar el registro: se manda en un hilo aparte (sendBienvenidaAsync).
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String SITIO = "https://aulix.study";

    private final EmailSender sender;

    public EmailService(EmailSender sender) {
        this.sender = sender;
    }

    /** Envía un correo con el proveedor activo (síncrono). */
    public void send(String to, String subject, String html, String text) {
        sender.send(to, subject, html, text);
    }

    /**
     * Correo de bienvenida al crear una cuenta. NUNCA incluye la contraseña:
     * la contraseña la conoce solo el usuario que se registra.
     */
    public void sendBienvenida(String to, String nombre) {
        String seguro = html(nombre);
        String htmlBody = "<p>Hola " + seguro + ",</p>"
                + "<p>Tu cuenta AULIX fue creada. Ya puedes entrar en "
                + "<a href=\"" + SITIO + "\">" + SITIO + "</a> "
                + "con tu correo y contraseña, o con tu cuenta de Google.</p>"
                + "<p>Tu clase, conectada. El aprendizaje, sin límites.</p>"
                + "<p>— Equipo AULIX</p>";
        String textBody = "Hola " + nombre + ",\n\n"
                + "Tu cuenta AULIX fue creada. Ya puedes entrar en " + SITIO + " "
                + "con tu correo y contraseña, o con tu cuenta de Google.\n\n"
                + "Tu clase, conectada. El aprendizaje, sin límites.\n\n— Equipo AULIX";
        send(to, "Tu cuenta AULIX fue creada", htmlBody, textBody);
    }

    /** Correo corto de prueba (lo usa POST /api/auth/test-email). */
    public void sendPrueba(String to) {
        send(to, "Correo de prueba AULIX",
                "<p>Este es un correo de prueba de AULIX. El envío con el proveedor configurado funciona correctamente.</p>",
                "Este es un correo de prueba de AULIX. El envío con el proveedor configurado funciona correctamente.");
    }

    /**
     * Como sendBienvenida, pero en un hilo aparte: el registro y el login
     * nunca se ralentizan ni fallan por el correo. Si el envío falla, solo
     * queda registrado en el log del servidor.
     */
    public void sendBienvenidaAsync(String to, String nombre) {
        CompletableFuture.runAsync(() -> {
            try {
                sendBienvenida(to, nombre);
            } catch (Exception e) {
                log.warn("No se pudo enviar el correo de bienvenida a {}: {}", to, e.getMessage());
            }
        });
    }

    /** Escapa texto para incrustarlo en HTML (& < > " '). */
    private static String html(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
