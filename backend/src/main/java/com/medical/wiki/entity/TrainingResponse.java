package com.medical.wiki.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "training_responses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingResponse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private TrainingEvent trainingEvent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Nullable if we allow anonymous, but usually logged in

    @Column(name = "attendee_name")
    private String attendeeName; // Use this if user_id is null or just for record

    @Column(name = "answers_json", columnDefinition = "TEXT")
    private String answersJson; // Store questionnaire answers as JSON

    @Column(name = "attended_at", nullable = false)
    private LocalDateTime attendedAt;

    @PrePersist
    protected void onCreate() {
        attendedAt = LocalDateTime.now();
    }
}
