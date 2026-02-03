package com.medical.wiki.service;

import com.medical.wiki.dto.UserDto;
import com.medical.wiki.dto.UserUpdateDto;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;
import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final LoggingService loggingService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public List<UserDto> getAllUsers(String facility) {
        List<User> users;
        if (facility != null && !facility.isEmpty()) {
            users = userRepository.findByFacilityAndDeletedAtIsNull(facility);
        } else {
            users = userRepository.findAllByDeletedAtIsNull();
        }
        return users.stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<String> getDistinctFacilities() {
        return userRepository.findDistinctFacilities();
    }

    public List<UserDto> getAllUsersIncludingDeleted() {
        return userRepository.findAllIncludingDeleted().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto updateUser(Long id, UserUpdateDto dto, Long executorId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.role() != null)
            user.setRole(dto.role());
        if (dto.facility() != null)
            user.setFacility(dto.facility());
        if (dto.department() != null)
            user.setDepartment(dto.department());
        if (dto.email() != null)
            user.setEmail(dto.email());

        User updatedUser = userRepository.save(user);

        String executorName = "ADMIN";
        if (executorId != null) {
            executorName = userRepository.findById(executorId).map(u -> u.getName()).orElse("ADMIN");
        }

        loggingService.log(
                "USER_UPDATE",
                user.getName() + " (" + user.getEmployeeId() + ")",
                String.format("Updated Role: %s, Facility: %s, Department: %s, Email: %s", dto.role(), dto.facility(),
                        dto.department(), dto.email()),
                executorName);

        return UserDto.fromEntity(updatedUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setDeletedAt(java.time.LocalDateTime.now());
        userRepository.save(user);
        loggingService.log("USER_DELETE", user.getName(), "User soft-deleted", "ADMIN");
    }

    public java.util.Optional<UserDto> getUserById(Long id) {
        return userRepository.findById(id).map(UserDto::fromEntity);
    }

    @Transactional
    public UserDto registerUser(com.medical.wiki.dto.UserCreateDto dto, Long executorId) {
        String executorName = resolveExecutorName(executorId);
        String normalizedName = validateAndNormalizeName(dto.name(), "登録者名");

        if (userRepository.findByEmployeeIdAndDeletedAtIsNull(dto.employeeId()).isPresent()) {
            loggingService.log("USER_REGISTER_FAIL", dto.employeeId(),
                    "Registration failed: Duplicate ID [" + dto.employeeId() + "]", executorName);
            throw new RuntimeException("職員番号 [" + dto.employeeId() + "] は既に登録されています。");
        }

        String rawPassword = (dto.password() == null || dto.password().isBlank())
                ? UUID.randomUUID().toString().substring(0, 8)
                : dto.password();
        String invitationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .employeeId(dto.employeeId())
                .name(normalizedName)
                .password(passwordEncoder.encode(rawPassword))
                .facility(dto.facility())
                .department(dto.department())
                .role(dto.role())
                .email(dto.email())
                .createdAt(java.time.LocalDateTime.now())
                .updatedAt(java.time.LocalDateTime.now())
                .mustChangePassword(true)
                .invitationToken(invitationToken)
                .build();

        User savedUser = userRepository.save(user);
        loggingService.log("USER_REGISTER_SUCCESS", savedUser.getName() + " (" + savedUser.getEmployeeId() + ")",
                "New user registered", executorName);
        return UserDto.fromEntity(savedUser);
    }

    @Transactional
    public void restoreUser(Long id, Long executorId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setDeletedAt(null);
        userRepository.save(user);

        String executorName = resolveExecutorName(executorId);
        loggingService.log("USER_RECOVERY", user.getName() + " (" + user.getEmployeeId() + ")",
                "User restored from archive", executorName);
    }

    public java.util.Map<String, Object> validateBulkCsv(List<com.medical.wiki.dto.UserCreateDto> dtos) {
        List<String> errors = new java.util.ArrayList<>();
        List<com.medical.wiki.dto.UserDto> restorableUsers = new java.util.ArrayList<>();
        List<com.medical.wiki.dto.UserCreateDto> validNewUsers = new java.util.ArrayList<>();

        java.util.Set<String> seenIds = new java.util.HashSet<>();
        List<String> validFacilities = java.util.Arrays.asList("本館", "南棟", "ひまわりの里病院", "あおぞら中央クリニック");

        for (int i = 0; i < dtos.size(); i++) {
            com.medical.wiki.dto.UserCreateDto dto = dtos.get(i);
            int rowNum = i + 1;

            if (seenIds.contains(dto.employeeId())) {
                errors.add(rowNum + "行目のID [" + dto.employeeId() + "] がCSV内で重複しています。");
                continue;
            }
            seenIds.add(dto.employeeId());

            java.util.Optional<User> existing = userRepository.findByEmployeeIdIncludingDeleted(dto.employeeId());
            if (existing.isPresent()) {
                if (existing.get().getDeletedAt() == null) {
                    errors.add(rowNum + "行目のID [" + dto.employeeId() + "] は既にデータベースに存在します（在職中）。");
                } else {
                    restorableUsers.add(UserDto.fromEntity(existing.get()));
                }
                continue;
            }

            if (!validFacilities.contains(dto.facility())) {
                errors.add(rowNum + "行目: 施設名 '" + dto.facility() + "' が不正です。");
                continue;
            }

            try {
                validateAndNormalizeName(dto.name(), rowNum + "行目の名前");
                validNewUsers.add(dto);
            } catch (RuntimeException e) {
                errors.add(e.getMessage());
            }
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("isValid", errors.isEmpty());
        result.put("errors", errors);
        result.put("restorableUsers", restorableUsers);
        result.put("validNewUsers", validNewUsers); // For checking count if needed
        return result;
    }

    @Transactional
    public void bulkRegisterUsers(List<com.medical.wiki.dto.UserCreateDto> dtos, Long executorId,
            List<String> restoreIds) {
        String executorName = resolveExecutorName(executorId);
        List<String> errors = new java.util.ArrayList<>();
        java.util.Set<String> seenIds = new java.util.HashSet<>();
        java.util.Set<String> restoreIdSet = restoreIds == null ? new java.util.HashSet<>()
                : new java.util.HashSet<>(restoreIds);

        List<String> validFacilities = java.util.Arrays.asList("本館", "南棟", "ひまわりの里病院", "あおぞら中央クリニック");

        // 1. Validation Logic
        for (int i = 0; i < dtos.size(); i++) {
            com.medical.wiki.dto.UserCreateDto dto = dtos.get(i);
            int rowNum = i + 1;

            if (seenIds.contains(dto.employeeId())) {
                errors.add(rowNum + "行目のID [" + dto.employeeId() + "] がCSV内で重複しています。");
                continue;
            }
            seenIds.add(dto.employeeId());

            java.util.Optional<User> existing = userRepository.findByEmployeeIdIncludingDeleted(dto.employeeId());

            if (existing.isPresent()) {
                User user = existing.get();
                if (user.getDeletedAt() == null) {
                    errors.add(rowNum + "行目のID [" + dto.employeeId() + "] は既にデータベースに存在します（在職中）。");
                    continue;
                } else if (!restoreIdSet.contains(user.getEmployeeId())) {
                    errors.add(rowNum + "行目のID [" + dto.employeeId() + "] は削除済みですが復元対象として選択されていません。");
                    continue;
                }
            }

            if (!validFacilities.contains(dto.facility())) {
                errors.add(rowNum + "行目: 施設名 '" + dto.facility() + "' が不正です。");
                continue;
            }

            try {
                validateAndNormalizeName(dto.name(), rowNum + "行目の名前");
            } catch (RuntimeException e) {
                errors.add(e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            throw new RuntimeException(String.join("\n", errors));
        }

        // 2. Execution Logic
        int newCount = 0;
        int restoreCount = 0;

        for (com.medical.wiki.dto.UserCreateDto dto : dtos) {
            String normalizedName = validateAndNormalizeName(dto.name(), "");
            java.util.Optional<User> existing = userRepository.findByEmployeeIdIncludingDeleted(dto.employeeId());

            if (existing.isPresent() && restoreIdSet.contains(dto.employeeId())) {
                // Restore an existing deleted user
                User user = existing.get();
                user.setName(normalizedName);
                user.setFacility(dto.facility());
                user.setDepartment(dto.department());
                user.setRole(dto.role());
                user.setDeletedAt(null); // Clear deleted_at to restore
                user.setPassword(passwordEncoder.encode(dto.password()));
                user.setUpdatedAt(java.time.LocalDateTime.now());
                userRepository.save(user);

                loggingService.log("USER_RECOVERY", user.getName() + " (" + user.getEmployeeId() + ")",
                        "User restored via bulk import", executorName);
                restoreCount++;
            } else if (existing.isEmpty()) {
                // Create new user
                User user = User.builder()
                        .employeeId(dto.employeeId())
                        .name(normalizedName)
                        .password(passwordEncoder.encode(dto.password()))
                        .facility(dto.facility())
                        .department(dto.department())
                        .role(dto.role())
                        .createdAt(java.time.LocalDateTime.now())
                        .updatedAt(java.time.LocalDateTime.now())
                        .build();
                userRepository.save(user);
                newCount++;
            }
        }

        loggingService.log("USER_BULK_REGISTER", (newCount + restoreCount) + " users",
                String.format("Bulk registration completed: %d new, %d restored", newCount, restoreCount),
                executorName);
    }

    private String validateAndNormalizeName(String name, String context) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException(context + "が入力されていません。");
        }

        // 全角スペースを半角に置換
        String normalized = name.replace("　", " ").trim();

        // スペースで分割して2つ以上（姓と名）あるか確認。かつスペースが1つだけであることを推奨するが、
        // 連続するスペースは1つにまとめる
        normalized = normalized.replaceAll("\\s+", " ");

        if (!normalized.contains(" ")) {
            throw new RuntimeException(context + " [" + name + "] に姓と名の間のスペースがありません。「姓 名」の形式で入力してください。");
        }

        return normalized;
    }

    private String resolveExecutorName(Long executorId) {
        if (executorId == null)
            return "ADMIN";
        return userRepository.findById(executorId).map(User::getName).orElse("ADMIN");
    }

    @Transactional
    public String issueTempPassword(Long userId, Long executorId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String tempPassword = generateRandomPassword(8);
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        String executorName = resolveExecutorName(executorId);
        loggingService.log("ISSUE_TEMP_PW", user.getName(), "Temporary password issued", executorName);

        return tempPassword;
    }

    private String generateRandomPassword(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

}
