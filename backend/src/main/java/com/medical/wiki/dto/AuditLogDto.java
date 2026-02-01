package com.medical.wiki.dto;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;

public record AuditLogDto(
    Long id,
    String timestamp,
    String action,
    String target,
    String description,
    String performedBy,
    String ipAddress
) {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
    private static final ZoneId JST = ZoneId.of("Asia/Tokyo");

    public static AuditLogDto fromEntity(com.medical.wiki.entity.SystemLog entity) {
        return new AuditLogDto(
            entity.getId(),
            entity.getTimestamp() != null ? entity.getTimestamp().atZone(ZoneId.of("UTC")).withZoneSameInstant(JST).format(FORMATTER) : "",
            entity.getAction(),
            entity.getTarget(),
            entity.getDescription(),
            entity.getPerformedBy(),
            entity.getIpAddress()
        );
    }
}
