package com.aulix.aulix.dto;

import java.time.LocalDateTime;

public record ProgramacionRequest(
    LocalDateTime fechaActivacion,
    LocalDateTime fechaVencimiento,
    Boolean activacionAutomatica,
    String estado
) {}
