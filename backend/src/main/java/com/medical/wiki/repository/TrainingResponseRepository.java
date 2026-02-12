package com.medical.wiki.repository;

import com.medical.wiki.entity.TrainingResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TrainingResponseRepository extends JpaRepository<TrainingResponse, Long> {
    List<TrainingResponse> findByTrainingEventId(Long trainingEventId);

    List<TrainingResponse> findByUserId(Long userId);

    boolean existsByTrainingEventIdAndUserId(Long trainingEventId, Long userId);
}
