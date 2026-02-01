package com.medical.wiki.controller;

import com.medical.wiki.dto.*;
import com.medical.wiki.service.ManualService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/manuals")
@RequiredArgsConstructor
public class ManualController {
    private final ManualService manualService;

    @GetMapping
    public ResponseEntity<List<ManualDto>> getAllManuals(
            @RequestParam(required = false) String category,
            @RequestHeader("X-User-Id") Long userId) {
        if (category != null && !category.isEmpty()) {
            return ResponseEntity.ok(manualService.getManualsByCategory(category, userId));
        }
        return ResponseEntity.ok(manualService.getAllManuals(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ManualDto> getManual(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return manualService.getManualById(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ManualDto> createManual(
            @RequestBody ManualCreateRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(manualService.createManual(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ManualDto> updateManual(
            @PathVariable Long id,
            @RequestBody ManualCreateRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return manualService.updateManual(id, request, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(manualService.getAllCategories());
    }

    @PostMapping("/{id}/pdf")
    public ResponseEntity<String> uploadPdf(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") Long userId) throws IOException {
        // Basic check for ADMIN role could be added here or via SecurityConfig
        String filename = manualService.savePdf(id, file);
        return ResponseEntity.ok(filename);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<Resource> getPdf(@PathVariable Long id) {
        return manualService.getPdfResource(id)
                .map(resource -> ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource))
                .orElse(ResponseEntity.notFound().build());
    }
}
