package com.medical.wiki.controller;

import com.medical.wiki.dto.FacilityDto;
import com.medical.wiki.entity.Facility;
import com.medical.wiki.repository.FacilityRepository;
import com.medical.wiki.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {
    private final FacilityRepository facilityRepository;
    private final DepartmentRepository departmentRepository;

    private final com.medical.wiki.repository.UserRepository userRepository;

    @GetMapping
    public List<FacilityDto> getAll() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String employeeId = (String) auth.getPrincipal();

        com.medical.wiki.entity.User user = userRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == com.medical.wiki.entity.User.Role.ADMIN) {
            return facilityRepository.findByNameAndDeletedAtIsNull(user.getFacility())
                    .map(FacilityDto::from)
                    .map(List::of)
                    .orElse(List.of());
        }

        return facilityRepository.findByDeletedAtIsNullOrderByNameAsc()
                .stream()
                .map(FacilityDto::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacilityDto> getById(@PathVariable Long id) {
        return facilityRepository.findByIdAndDeletedAtIsNull(id)
                .map(FacilityDto::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "施設名は必須です"));
        }
        if (facilityRepository.existsByNameAndDeletedAtIsNull(name)) {
            return ResponseEntity.badRequest().body(Map.of("error", "同名の施設が既に存在します"));
        }
        Facility facility = Facility.builder().name(name.trim()).build();
        facilityRepository.save(facility);
        return ResponseEntity.ok(FacilityDto.from(facility));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return facilityRepository.findByIdAndDeletedAtIsNull(id)
                .map(facility -> {
                    String name = body.get("name");
                    if (name == null || name.isBlank()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "施設名は必須です"));
                    }
                    facility.setName(name.trim());
                    facilityRepository.save(facility);
                    return ResponseEntity.ok(FacilityDto.from(facility));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return facilityRepository.findByIdAndDeletedAtIsNull(id)
                .map(facility -> {
                    // Soft delete related departments first
                    departmentRepository.findByFacilityIdAndDeletedAtIsNullOrderByNameAsc(id)
                            .forEach(dept -> {
                                dept.setDeletedAt(LocalDateTime.now());
                                departmentRepository.save(dept);
                            });
                    facility.setDeletedAt(LocalDateTime.now());
                    facilityRepository.save(facility);
                    return ResponseEntity.ok(Map.of("message", "施設を削除しました"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
