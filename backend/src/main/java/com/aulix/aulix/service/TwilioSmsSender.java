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
 * Envío de SMS con Twilio (https://www.twilio.com/docs/sms).
 * Solo usa java.net.http.HttpClient (stdlib): no agrega dependencias.
 *
 * El SMS es texto plano: NO usa plantilla ni ContentSid (eso era solo
 * para WhatsApp). El mensaje es el mismo texto de bienvenida que se
 * usaba en la plantilla de WhatsApp, pero como Body directo.
 *
 * Endpoint: POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
 * Auth: HTTP Basic con Account SID + Auth Token.
 * Campos (form-urlencoded): From=<número trial de Twilio, ver LEEME>,
 * To=+521..., Body=texto de bienvenida.
 * Éxito: 201. Errores frecuentes de Twilio: 21211 (número 'To' inválido),
 * 21608 (cuenta trial: el número destino no está verificado en
 * Verified Caller IDs), 20003 (SID o token incorrectos).
 *
 * Las credenciales se leen de twilio.* (variables TWILIO_ACCOUNT_SID,
 * TWILIO_AUTH_TOKEN y TWILIO_SMS_FROM en el .env del VPS). Sin ellas,
 * configurado() es false y SmsService no intenta enviar nada: el
 * arranque nunca se rompe por esto. El número remitente NO tiene valor
 * por defecto en el código: se pone en TWILIO_SMS_FROM (ver LEEME).
 */
@Service
public class TwilioSmsSender {

    private static final String TWILIO_URL = "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json";

    private final String accountSid;
    private final String authToken;
    private final String from;
    private final HttpClient httpClient;

    public TwilioSmsSender(
            @Value("${twilio.account-sid:}") String accountSid,
            @Value("${twilio.auth-token:}") String authToken,
            @Value("${twilio.sms.from:}") String from) {
        this.accountSid = accountSid == null ? "" : accountSid.trim();
        this.authToken = authToken == null ? "" : authToken.trim();
        this.from = from == null ? "" : from.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /** true solo si están las 3 credenciales (SID, token y remitente). */
    public boolean configurado() {
        return !accountSid.isBlank() && !authToken.isBlank() && !from.isBlank();
    }

    /**
     * Envía el SMS de bienvenida al número E.164 ya normalizado
     * (ej. +5215512345678). Síncrono. Si Twilio no está configurado o
     * responde un error, lanza IllegalStateException con el mensaje que
     * devolvió Twilio.
     */
    public void sendBienvenida(String telefonoE164, String nombre) {
        if (!configurado()) {
            throw new IllegalStateException("Twilio no configurado: faltan TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o TWILIO_SMS_FROM en el .env del servidor");
        }
        String texto = "Hola " + (nombre == null ? "" : nombre.trim())
                + ", tu cuenta en AULIX fue creada. ¡Bienvenido a la plataforma!";
        String body = "From=" + urlEncode(from)
                + "&To=" + urlEncode(telefonoE164)
                + "&Body=" + urlEncode(texto);
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
            throw new IllegalStateException("El envío por SMS fue interrumpido", e);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo contactar a Twilio: " + e.getMessage(), e);
        }
    }

    private static String urlEncode(String valor) {
        return URLEncoder.encode(valor, StandardCharsets.UTF_8);
    }
}
