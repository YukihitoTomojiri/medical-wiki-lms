package com.medical.wiki.controller;

import com.medical.wiki.dto.DepartmentDto;
import com.medical.wiki.entity.Department;
import com.medical.wiki.repository.DepartmentRepository;
import com.medical.wiki.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {
    private final DepartmentRepository departmentRepository;
    private final FacilityRepository facilityRepository;

    @GetMapping
    public List<DepartmentDto> getAll() {
        return departmentRepository.findByDeletedAtIsNullOrderByNameAsc()
                .stream()
                .map(DepartmentDto::from)
                .toList();
    }

    @GetMapping("/by-facility/{facilityId}")
    public List<DepartmentDto> getByFacility(@PathVariable Long facilityId) {
        return departmentRepository.findByFacilityIdAndDeletedAtIsNullOrderByNameAsc(facilityId)
                .stream()
                .map(DepartmentDto::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentDto> getById(@PathVariable Long id) {
        return departmentRepository.findByIdAndDeletedAtIsNull(id)
                .map(DepartmentDto::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        Long facilityId = body.get("facilityId") != null ? Long.valueOf(body.get("facilityId").toString()) : null;

        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "部署名は必須です"));
        }
        if (facilityId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "施設の選択は必須です"));
        }

        return facilityRepository.findByIdAndDeletedAtIsNull(facilityId)
                .map(facility -> {
                    if (departmentRepository.existsByNameAndFacilityIdAndDeletedAtIsNull(name, facilityId)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "同じ施設内に同名の部署が既に存在します"));
                    }
                    Department department = Department.builder()
                            .name(name.trim())
                            .facility(facility)
                            .build();
                    departmentRepository.save(department);
                    return ResponseEntity.ok(DepartmentDto.from(department));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "指定された施設が見つかりません")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return departmentRepository.findByIdAndDeletedAtIsNull(id)
                .map(department -> {
                    String name = (String) body.get("name");
                    if (name == null || name.isBlank()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "部署名は必須です"));
                    }
                    department.setName(name.trim());
                    departmentRepository.save(department);
                    return ResponseEntity.ok(DepartmentDto.from(department));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return departmentRepository.findByIdAndDeletedAtIsNull(id)
                .map(department -> {
                    department.setDeletedAt(LocalDateTime.now());
                    departmentRepository.save(department);
                    return ResponseEntity.ok(Map.of("message", "部署を削除しました"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
