package com.medical.wiki.controller;

import com.medical.wiki.entity.TrainingResponse;
import com.medical.wiki.service.TrainingResponseService;
import com.medical.wiki.config.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/training/responses")
@RequiredArgsConstructor
public class TrainingResponseController {

    private final TrainingResponseService trainingResponseService;

    @PostMapping("/{eventId}")
    public TrainingResponse submitResponse(@AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long eventId,
            @RequestBody Map<String, String> payload) {
        String answersJson = payload.get("answersJson");
        return trainingResponseService.submitResponse(userPrincipal.getId(), eventId, answersJson);
    }

    @GetMapping("/{eventId}")
    public List<TrainingResponse> getResponses(@PathVariable Long eventId) {
        // Add permission check if needed (Admin only)
        return trainingResponseService.getResponsesForEvent(eventId);
    }

    @GetMapping("/me")
    public List<TrainingResponse> getMyResponses(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return trainingResponseService.getMyResponses(userPrincipal.getId());
    }
}
