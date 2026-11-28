package com.aulix.aulix.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Envío con Resend (https://resend.com), el mismo código que ya funciona
 * desde el 2026-11-24, movido tal cual desde el antiguo EmailService.
 * Solo usa java.net.http.HttpClient (stdlib): no agrega dependencias.
 *
 * Es el RESPALDO, no el camino principal: solo se activa cuando
 * {@code aulix.email.proveedor=resend}. La clave se lee de
 * {@code resend.api-key} (variable RESEND_API_KEY en el .env del VPS)
 * y el remitente de {@code resend.from} (EMAIL_FROM). Sin clave, los
 * envíos lanzan IllegalStateException.
 */
@Service
@ConditionalOnProperty(name = "aulix.email.proveedor", havingValue = "resend")
public class ResendEmailSender implements EmailSender {

    private static final String RESEND_URL = "https://api.resend.com/emails";
    private static final String REMITENTE_POR_DEFECTO = "AULIX <onboarding@resend.dev>";

    private final String apiKey;
    private final String from;
    private final HttpClient httpClient;

    public ResendEmailSender(
            @Value("${resend.api-key:}") String apiKey,
            @Value("${resend.from:}") String from) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.from = (from == null || from.isBlank()) ? REMITENTE_POR_DEFECTO : from.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Envía un correo por Resend (síncrono). Si la clave no está
     * configurada lanza IllegalStateException; si Resend responde un
     * error, también (con el código y el cuerpo que devolvió Resend).
     */
    @Override
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
}
