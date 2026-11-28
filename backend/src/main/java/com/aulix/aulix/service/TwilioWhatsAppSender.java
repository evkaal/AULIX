package com.aulix.aulix.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Envío de WhatsApp con Twilio (https://www.twilio.com/docs/whatsapp).
 * Solo usa java.net.http.HttpClient (stdlib): no agrega dependencias.
 *
 * Se envía una PLANTILLA aprobada por Meta (Content API): la bienvenida
 * es un mensaje que inicia el negocio, así que no se puede mandar texto
 * libre fuera de la ventana de 24 h. La plantilla se crea en el Content
 * Template Builder de la consola de Twilio (NO en el apartado viejo de
 * "WhatsApp Templates") y se manda por su ContentSid (HX...) con las
 * variables en ContentVariables.
 *
 * Endpoint: POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
 * Auth: HTTP Basic con Account SID + Auth Token.
 * Campos (form-urlencoded): From=whatsapp:+14155238886 (sandbox),
 * To=whatsapp:+521..., ContentSid=HX..., ContentVariables={"1": nombre}.
 * Éxito: 201. Errores frecuentes de Twilio: 21211 (número 'To' inválido),
 * 21608 (cuenta trial: el número no está verificado), 63016 (plantilla
 * no aprobada o ContentSid incorrecto).
 *
 * Las credenciales se leen de twilio.* (variables TWILIO_ACCOUNT_SID,
 * TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, TWILIO_WHATSAPP_TEMPLATE_SID
 * en el .env del VPS). Sin ellas, configurado() es false y WhatsAppService
 * no intenta enviar nada: el arranque nunca se rompe por esto.
 */
@Service
public class TwilioWhatsAppSender {

    private static final String TWILIO_URL = "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json";
    private static final String REMITENTE_POR_DEFECTO = "whatsapp:+14155238886";

    private final String accountSid;
    private final String authToken;
    private final String from;
    private final String templateSid;
    private final HttpClient httpClient;

    public TwilioWhatsAppSender(
            @Value("${twilio.account-sid:}") String accountSid,
            @Value("${twilio.auth-token:}") String authToken,
            @Value("${twilio.whatsapp.from:}") String from,
            @Value("${twilio.whatsapp.template-sid:}") String templateSid) {
        this.accountSid = accountSid == null ? "" : accountSid.trim();
        this.authToken = authToken == null ? "" : authToken.trim();
        this.from = (from == null || from.isBlank()) ? REMITENTE_POR_DEFECTO : from.trim();
        this.templateSid = templateSid == null ? "" : templateSid.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /** true solo si están las 3 credenciales (SID, token y ContentSid). */
    public boolean configurado() {
        return !accountSid.isBlank() && !authToken.isBlank() && !templateSid.isBlank();
    }

    /**
     * Envía la plantilla de bienvenida al número E.164 ya normalizado
     * (ej. +5215512345678). Síncrono. Si Twilio no está configurado o
     * responde un error, lanza IllegalStateException con el mensaje que
     * devolvió Twilio.
     */
    public void sendBienvenida(String telefonoE164, String nombre) {
        if (!configurado()) {
            throw new IllegalStateException("Twilio no configurado: faltan TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o TWILIO_WHATSAPP_TEMPLATE_SID en el .env del servidor");
        }
        String variables = "{\"1\":" + json(nombre == null ? "" : nombre) + "}";
        String body = "From=" + urlEncode(from)
                + "&To=" + urlEncode("whatsapp:" + telefonoE164)
                + "&ContentSid=" + urlEncode(templateSid)
                + "&ContentVariables=" + urlEncode(variables);
        String basic = Base64.getEncoder()
                .encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(TWILIO_URL.formatted(accountSid)))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Basic " + basic)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Twilio respondió " + response.statusCode() + ": " + response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("El envío por WhatsApp fue interrumpido", e);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo contactar a Twilio: " + e.getMessage(), e);
        }
    }

    private static String urlEncode(String valor) {
        return URLEncoder.encode(valor, StandardCharsets.UTF_8);
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
