package com.aulix.aulix.service;

import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.aulix.aulix.entity.Usuario;

/**
 * Fachada de SMS: el resto del código (AuthService, AuthController)
 * solo conoce esta clase. El envío real lo hace TwilioSmsSender.
 *
 * SOLO se manda UN mensaje: la bienvenida al crear la cuenta, por SMS
 * en texto plano (sin links). Si el usuario no tiene teléfono, no se
 * manda nada. Si Twilio no está configurado o el envío falla, el
 * registro NUNCA falla: la versión asíncrona solo lo deja en el log
 * del servidor (igual que el correo de bienvenida).
 *
 * Nota: la cuenta Twilio es trial: solo manda SMS a números verificados
 * (Verified Caller IDs en la consola). Un número sin verificar responde
 * 21608 y el registro sigue funcionando igual.
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    private final TwilioSmsSender sender;

    public SmsService(TwilioSmsSender sender) {
        this.sender = sender;
    }

    /**
     * Bienvenida asíncrona (la usan los hooks de registro). Nunca lanza
     * excepciones: sin teléfono, sin configuración o con error de Twilio,
     * solo queda en el log.
     */
    public void sendBienvenidaAsync(Usuario usuario) {
        CompletableFuture.runAsync(() -> {
            try {
                sendBienvenida(usuario);
            } catch (Exception e) {
                log.warn("No se pudo enviar el SMS de bienvenida a {}: {}", usuario.getEmail(), e.getMessage());
            }
        });
    }

    /**
     * Bienvenida síncrona. No hace nada si no hay teléfono válido o si
     * Twilio no está configurado.
     */
    public void sendBienvenida(Usuario usuario) {
        if (usuario == null || usuario.getTelefono() == null || usuario.getTelefono().isBlank()) {
            return;
        }
        String telefono = normalizar(usuario.getTelefono());
        if (telefono == null) {
            log.warn("Teléfono inválido para el SMS de bienvenida ({}): {}", usuario.getEmail(), usuario.getTelefono());
            return;
        }
        if (!sender.configurado()) {
            log.warn("Twilio no configurado: no se envía el SMS de bienvenida a {}", usuario.getEmail());
            return;
        }
        sender.sendBienvenida(telefono, usuario.getNombre());
        log.info("SMS de bienvenida enviado a {}", usuario.getEmail());
    }

    /**
     * Prueba síncrona (la usa POST /api/auth/test-sms). Lanza
     * IllegalArgumentException si el teléfono no es válido (400) e
     * IllegalStateException si Twilio no está configurado o responde
     * un error (500 con el mensaje de Twilio).
     */
    public void sendPrueba(String telefonoCrudo, String nombre) {
        String telefono = normalizar(telefonoCrudo);
        if (telefono == null) {
            throw new IllegalArgumentException("El teléfono no es válido. Usa 10 dígitos (ej. 5512345678) o formato internacional (ej. +525512345678)");
        }
        if (!sender.configurado()) {
            throw new IllegalStateException("Twilio no configurado: faltan TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o TWILIO_SMS_FROM en el .env del servidor");
        }
        sender.sendBienvenida(telefono, nombre == null || nombre.isBlank() ? "Prueba" : nombre.trim());
    }

    /**
     * Normaliza un teléfono a E.164. Quita espacios, guiones, paréntesis
     * y puntos. Un número mexicano de 10 dígitos se convierte en
     * +52 + dígitos. Un número que ya viene en +E.164 se deja tal cual.
     * Devuelve null si no se puede interpretar como teléfono válido.
     *
     * OJO: el prefijo +521 es obsoleto desde 2019 (México eliminó el 1
     * para móviles). El formato vigente y el que Twilio tiene verificado
     * es +52 + 10 dígitos. Si el número viene con el 1 (+521... o
     * 521...), se quita: +5219518741946 -> +529518741946. Con el 1,
     * Twilio lo trata como otro número distinto y responde 572002
     * ("add the 'to' number as a verified recipient").
     */
    public static String normalizar(String telefonoCrudo) {
        if (telefonoCrudo == null) {
            return null;
        }
        String limpio = telefonoCrudo.replaceAll("[\\s\\-().]", "");
        if (limpio.isBlank()) {
            return null;
        }
        if (limpio.startsWith("+")) {
            if (limpio.matches("\\+521\\d{10}")) {
                return "+52" + limpio.substring(4);
            }
            return limpio.matches("\\+\\d{10,15}") ? limpio : null;
        }
        if (!limpio.matches("\\d+")) {
            return null;
        }
        if (limpio.length() == 10) {
            return "+52" + limpio;
        }
        if (limpio.length() == 12 && limpio.startsWith("52")) {
            return "+" + limpio;
        }
        if (limpio.length() == 13 && limpio.startsWith("521")) {
            return "+52" + limpio.substring(3);
        }
        if (limpio.length() >= 10 && limpio.length() <= 15) {
            return "+" + limpio;
        }
        return null;
    }
}
