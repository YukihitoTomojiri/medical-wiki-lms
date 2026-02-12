package com.medical.wiki.service;

import com.medical.wiki.entity.Committee;
import com.medical.wiki.entity.TrainingEvent;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.TrainingEventRepository;
import com.medical.wiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainingEventService {

    private final TrainingEventRepository trainingEventRepository;
    private final UserRepository userRepository;
    private final com.medical.wiki.repository.FacilityRepository facilityRepository;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional(readOnly = true)
    public List<TrainingEvent> getVisibleEvents(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.DEVELOPER) {
            return trainingEventRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        }

        Set<Long> committeeIds = user.getCommittees().stream()
                .map(Committee::getId)
                .collect(Collectors.toSet());

        // If no committees, pass empty set (but not null, to avoid SQL issues if using
        // IN empty list?)
        // JPQL IN empty collection might cause issues, check implementation.
        // If empty, better handling might be needed, but let's assume empty set works
        // or pass dummy.
        if (committeeIds.isEmpty()) {
            committeeIds = Collections.singleton(-1L);
        }

        return trainingEventRepository.findVisibleEvents(committeeIds, user.getJobType(), LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<TrainingEvent> getAllEventsForAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.DEVELOPER) {
            return trainingEventRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        }

        Long facilityId = null;
        if (user.getFacility() != null && !user.getFacility().isEmpty()) {
            facilityId = facilityRepository.findByNameAndDeletedAtIsNull(user.getFacility())
                    .map(f -> f.getId())
                    .orElse(null);
        }

        if (facilityId != null) {
            return trainingEventRepository.findByFacilityIdAndDeletedAtIsNullOrderByCreatedAtDesc(facilityId);
        } else {
            // Fallback for Admin with no facility
            return trainingEventRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        }
    }

    @Transactional
    public TrainingEvent createEvent(Long userId, String title, String description, String videoUrl,
            String materialsUrl, Long targetCommitteeId, String targetJobType,
            LocalDateTime startTime, LocalDateTime endTime) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only Admin/Dev
        if (user.getRole() == User.Role.USER) {
            throw new RuntimeException("Unauthorized");
        }

        Long facilityId = null;
        if (user.getFacility() != null && !user.getFacility().isEmpty()) {
            facilityId = facilityRepository.findByNameAndDeletedAtIsNull(user.getFacility())
                    .map(f -> f.getId())
                    .orElse(null);
        }

        TrainingEvent event = TrainingEvent.builder()
                .title(title)
                .description(description)
                .videoUrl(videoUrl)
                .materialsUrl(materialsUrl)
                .targetCommitteeId(targetCommitteeId)
                .targetJobType(targetJobType)
                .startTime(startTime)
                .endTime(endTime)
                .qrCodeToken(UUID.randomUUID().toString())
                .createdBy(user)
                .facilityId(facilityId)
                .build();

        return trainingEventRepository.save(event);
    }

    @Transactional
    public TrainingEvent updateEvent(Long userId, Long eventId, String title, String description, String videoUrl,
            String materialsUrl, Long targetCommitteeId, String targetJobType,
            LocalDateTime startTime, LocalDateTime endTime) {
        // ... Permissions ...
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.USER)
            throw new RuntimeException("Unauthorized");

        TrainingEvent event = trainingEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        event.setTitle(title);
        event.setDescription(description);
        event.setVideoUrl(videoUrl);
        event.setMaterialsUrl(materialsUrl);
        event.setTargetCommitteeId(targetCommitteeId);
        event.setTargetJobType(targetJobType);
        event.setStartTime(startTime);
        event.setEndTime(endTime);

        return trainingEventRepository.save(event);
    }

    public String getQrCodeUrl(Long eventId) {
        TrainingEvent event = trainingEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        // e.g. http://localhost:5173/training/123
        return frontendUrl + "/training/" + event.getId();
    }

    @Transactional(readOnly = true)
    public TrainingEvent getEvent(Long userId, Long eventId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TrainingEvent event = trainingEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (user.getRole() == User.Role.DEVELOPER) {
            return event;
        }

        // Check facility for ADMIN/USER
        if (event.getFacilityId() != null) {
            Long userFacilityId = null;
            if (user.getFacility() != null && !user.getFacility().isEmpty()) {
                userFacilityId = facilityRepository.findByNameAndDeletedAtIsNull(user.getFacility())
                        .map(f -> f.getId())
                        .orElse(null);
            }
            if (userFacilityId == null || !userFacilityId.equals(event.getFacilityId())) {
                throw new RuntimeException("Access denied: Facility mismatch");
            }
        }

        if (user.getRole() == User.Role.ADMIN) {
            return event;
        }

        // ROLE_USER check target
        boolean committeeMatch = event.getTargetCommitteeId() == null ||
                user.getCommittees().stream().anyMatch(c -> c.getId().equals(event.getTargetCommitteeId()));

        boolean jobTypeMatch = event.getTargetJobType() == null || event.getTargetJobType().isEmpty() ||
                (user.getJobType() != null && user.getJobType().equals(event.getTargetJobType()));

        if (!committeeMatch && !jobTypeMatch) {
            throw new RuntimeException("Access denied: Not a target audience");
        }

        return event;
    }
}
