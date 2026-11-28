package com.aulix.aulix.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Envío por el Postfix propio del VPS, como pide el requisito
 * ("servidor de correo propio, sin pagar servicios de terceros").
 *
 * Usa el JavaMailSender que Spring Boot configura solo con las
 * propiedades {@code spring.mail.*} de application.properties: host
 * localhost, puerto 25, sin autenticación ni STARTTLS, porque el
 * Postfix es local (el backend y el servidor de correo viven en la
 * misma VPS). El remitente es {@code aulix.email.from} (variable
 * EMAIL_FROM, por defecto {@code AULIX <noreply@aulix.study>}).
 *
 * Activa solo cuando {@code aulix.email.proveedor=postfix}, que es el
 * valor por defecto si la propiedad no está definida. Si Postfix no
 * está instalado o el puerto 25 de salida está bloqueado, el envío
 * falla aquí y el respaldo es poner {@code EMAIL_PROVEEDOR=resend}
 * en el .env y reiniciar: no hay que recompilar nada.
 */
@Service
@ConditionalOnProperty(name = "aulix.email.proveedor", havingValue = "postfix", matchIfMissing = true)
public class PostfixEmailSender implements EmailSender {

    private final JavaMailSender mailSender;
    private final String from;

    public PostfixEmailSender(
            JavaMailSender mailSender,
            @Value("${aulix.email.from:AULIX <noreply@aulix.study>}") String from) {
        this.mailSender = mailSender;
        this.from = (from == null || from.isBlank()) ? "AULIX <noreply@aulix.study>" : from.trim();
    }

    @Override
    public void send(String to, String subject, String html, String text) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, html);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new IllegalStateException("No se pudo enviar por Postfix local: " + e.getMessage(), e);
        }
    }
}
