package com.medical.wiki.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "training_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "announcement_id", nullable = false)
    private Long announcementId;

    @Column(name = "manual_id", nullable = false)
    private Long manualId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        completedAt = LocalDateTime.now();
    }
}
