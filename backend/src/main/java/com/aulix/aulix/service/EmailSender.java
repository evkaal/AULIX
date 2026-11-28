package com.aulix.aulix.service;

/**
 * Contrato de envío de correo. Hay dos implementaciones y solo una está
 * activa a la vez, según la propiedad {@code aulix.email.proveedor}:
 *
 * <ul>
 *   <li>{@code postfix} (valor por defecto): {@link PostfixEmailSender},
 *       JavaMailSender contra el Postfix local del VPS. Es el camino que
 *       pide el requisito: servidor propio, sin servicios de terceros.</li>
 *   <li>{@code resend}: {@link ResendEmailSender}, la API de Resend que ya
 *       funciona. Solo es el respaldo si Postfix falla en la demo.</li>
 * </ul>
 *
 * El resto del código (AuthService, AuthController) solo conoce
 * {@link EmailService}, así que cambiar de proveedor es cambiar una línea
 * en el .env y reiniciar, sin tocar nada más.
 */
public interface EmailSender {

    /**
     * Envía un correo. Si el envío no se puede hacer, lanza
     * IllegalStateException con el motivo (falta de configuración, error
     * del servidor local o de la API). El llamador decide si el fallo
     * debe tumbar la operación o solo quedar en el log.
     */
    void send(String to, String subject, String html, String text);
}
