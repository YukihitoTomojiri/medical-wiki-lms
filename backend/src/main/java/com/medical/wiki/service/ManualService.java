package com.medical.wiki.service;

import com.medical.wiki.dto.*;
import com.medical.wiki.entity.*;
import com.medical.wiki.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.nio.file.*;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

@Service
@RequiredArgsConstructor
public class ManualService {
    private final ManualRepository manualRepository;
    private final ProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final LoggingService loggingService;
    private final SecurityAnomalyService securityAnomalyService;
    private final String uploadDir = "/app/uploads/manuals";

    public List<ManualDto> getAllManuals(Long userId) {
        List<Manual> manuals = manualRepository.findAllByOrderByCreatedAtDesc();
        Set<Long> readManualIds = progressRepository.findByUserId(userId)
                .stream()
                .map(p -> p.getManual().getId())
                .collect(Collectors.toSet());

        return manuals.stream()
                .map(m -> ManualDto.fromEntity(m, readManualIds.contains(m.getId())))
                .collect(Collectors.toList());
    }

    public List<ManualDto> getManualsByCategory(String category, Long userId) {
        List<Manual> manuals = manualRepository.findByCategory(category);
        Set<Long> readManualIds = progressRepository.findByUserId(userId)
                .stream()
                .map(p -> p.getManual().getId())
                .collect(Collectors.toSet());

        return manuals.stream()
                .map(m -> ManualDto.fromEntity(m, readManualIds.contains(m.getId())))
                .collect(Collectors.toList());
    }

    public Optional<ManualDto> getManualById(Long id, Long userId) {
        return manualRepository.findById(id)
                .map(m -> {
                    boolean isRead = progressRepository.existsByUserIdAndManualId(userId, id);
                    return ManualDto.fromEntity(m, isRead);
                });
    }

    @Transactional
    public ManualDto createManual(ManualCreateRequest request, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Manual manual = Manual.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .author(author)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Manual newManual = manualRepository.save(manual);
        loggingService.log("MANUAL_CREATE", newManual.getTitle(), "Manual created by " + author.getName(),
                author.getEmployeeId());

        return ManualDto.fromEntity(newManual);
    }

    @Transactional
    public Optional<ManualDto> updateManual(Long id, ManualCreateRequest request, Long executorId) {
        return manualRepository.findById(id)
                .map(manual -> {
                    manual.setTitle(request.getTitle());
                    manual.setContent(request.getContent());
                    manual.setCategory(request.getCategory());
                    if (request.getPdfPath() != null) {
                        manual.setPdfPath(request.getPdfPath());
                    }
                    manual.setUpdatedAt(LocalDateTime.now());
                    Manual saved = manualRepository.save(manual);

                    String executorName = "ADMIN";
                    if (executorId != null) {
                        executorName = userRepository.findById(executorId).map(User::getName).orElse("ADMIN");
                    }
                    loggingService.log("MANUAL_UPDATE", saved.getTitle(), "Manual updated", executorName);

                    return ManualDto.fromEntity(saved);
                });
    }

    public List<String> getAllCategories() {
        return manualRepository.findAll().stream()
                .map(Manual::getCategory)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public String savePdf(Long manualId, MultipartFile file) throws IOException {
        Path root = Paths.get(uploadDir);
        if (!Files.exists(root)) {
            Files.createDirectories(root);
        }

        String filename = "manual_" + manualId + ".pdf";
        Path filepath = root.resolve(filename);
        Files.copy(file.getInputStream(), filepath, StandardCopyOption.REPLACE_EXISTING);

        Manual manual = manualRepository.findById(manualId)
                .orElseThrow(() -> new RuntimeException("Manual not found"));
        manual.setPdfPath(filename);
        manualRepository.save(manual);

        return filename;
    }

    public Optional<Resource> getPdfResource(Long manualId, Long userId, String ipAddress) {
        return manualRepository.findById(manualId)
                .flatMap(manual -> {
                    if (manual.getPdfPath() == null) {
                        return Optional.empty();
                    }
                    try {
                        Path file = Paths.get(uploadDir).resolve(manual.getPdfPath());
                        Resource resource = new UrlResource(file.toUri());
                        if (resource.exists() || resource.isReadable()) {
                            // Log and Check Anomaly
                            if (userId != null) {
                                userRepository.findById(userId).ifPresent(user -> {
                                    loggingService.log("MANUAL_DOWNLOAD", manual.getTitle(), "Manual PDF Downloaded",
                                            user.getEmployeeId());
                                    securityAnomalyService.checkDownloadAnomaly(user, ipAddress);
                                });
                            }
                            return Optional.of(resource);
                        }
                    } catch (Exception e) {
                        // Log error
                    }
                    return Optional.empty();
                });
    }
}
