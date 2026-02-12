package com.medical.wiki.service;

import com.medical.wiki.entity.TrainingEvent;
import com.medical.wiki.entity.TrainingResponse;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.TrainingEventRepository;
import com.medical.wiki.repository.TrainingResponseRepository;
import com.medical.wiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainingResponseService {

    private final TrainingResponseRepository trainingResponseRepository;
    private final TrainingEventRepository trainingEventRepository;
    private final UserRepository userRepository;

    @Transactional
    public TrainingResponse submitResponse(@org.springframework.lang.NonNull Long userId,
            @org.springframework.lang.NonNull Long eventId, String answersJson) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (trainingResponseRepository.existsByTrainingEventIdAndUserId(eventId, userId)) {
            throw new RuntimeException("Duplicate submission");
        }

        TrainingEvent event = trainingEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // Basic check target? Maybe relax check for now to allow anyone with link/QR

        TrainingResponse response = TrainingResponse.builder()
                .trainingEvent(event)
                .user(user)
                .attendeeName(user.getName())
                .answersJson(answersJson)
                .attendedAt(LocalDateTime.now())
                .build();

        return trainingResponseRepository.save(response);
    }

    @Transactional(readOnly = true)
    public List<TrainingResponse> getResponsesForEvent(Long eventId) {
        return trainingResponseRepository.findByTrainingEventId(eventId);
    }

    public List<TrainingResponse> getMyResponses(Long userId) {
        return trainingResponseRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public String exportResponses(Long eventId) {
        TrainingEvent event = trainingEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        List<TrainingResponse> responses = trainingResponseRepository.findByTrainingEventId(eventId);

        StringBuilder sb = new StringBuilder();
        sb.append("研修タイトル: ").append(event.getTitle()).append("\n");
        sb.append("記述日: ").append(LocalDateTime.now()).append("\n");
        sb.append("回答数: ").append(responses.size()).append("\n\n");
        sb.append("--- 回答一覧 ---\n");

        for (TrainingResponse res : responses) {
            sb.append("氏名: ").append(res.getAttendeeName()).append("\n");
            sb.append("回答日時: ").append(res.getAttendedAt()).append("\n");
            sb.append("内容: ").append(res.getAnswersJson()).append("\n");
            sb.append("\n");
        }

        return sb.toString();
    }
}
