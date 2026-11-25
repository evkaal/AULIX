package com.aulix.aulix.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Envío de correos con Resend (https://resend.com), igual que en DONAVIDA:
 * el mismo servicio, la misma cuenta y la misma clave API. Solo usa
 * java.net.http.HttpClient (stdlib): no se agregan dependencias a Maven.
 *
 * La clave se lee de la propiedad resend.api-key (variable RESEND_API_KEY
 * en el .env del VPS) y el remitente de resend.from (EMAIL_FROM). Sin clave,
 * los envíos lanzan IllegalStateException. El registro NUNCA falla por el
 * correo: el bienvenida se manda en un hilo aparte (sendBienvenidaAsync).
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String RESEND_URL = "https://api.resend.com/emails";
    private static final String REMITENTE_POR_DEFECTO = "AULIX <onboarding@resend.dev>";
    private static final String SITIO = "https://aulix.study";

    private final String apiKey;
    private final String from;
    private final HttpClient httpClient;

    public EmailService(
            @Value("${resend.api-key:}") String apiKey,
            @Value("${resend.from:}") String from) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.from = (from == null || from.isBlank()) ? REMITENTE_POR_DEFECTO : from.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Envía un correo por Resend (síncrono). Si la clave no está configurada
     * lanza IllegalStateException; si Resend responde un error, también
     * (con el código y el cuerpo que devolvió Resend).
     */
    public void send(String to, String subject, String html, String text) {
        if (apiKey.isBlank()) {
            throw new IllegalStateException("RESEND_API_KEY no configurada en el .env del servidor");
        }
        String body = "{\"from\":" + json(from)
                + ",\"to\":[" + json(to) + "]"
                + ",\"subject\":" + json(subject)
                + ",\"html\":" + json(html)
                + ",\"text\":" + json(text) + "}";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(RESEND_URL))
                .timeout(Duration.ofSeconds(10))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Resend respondió " + response.statusCode() + ": " + response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("El envío del correo fue interrumpido", e);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo contactar a Resend: " + e.getMessage(), e);
        }
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
                "<p>Este es un correo de prueba de AULIX. El envío con Resend funciona correctamente.</p>",
                "Este es un correo de prueba de AULIX. El envío con Resend funciona correctamente.");
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

    /** Escapa una cadena para usarla como valor JSON entre comillas. */
    private static String json(String valor) {
        if (valor == null) {
            return "\"\"";
        }
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < valor.length(); i++) {
            char c = valor.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.append("\"").toString();
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
