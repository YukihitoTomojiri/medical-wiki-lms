package com.medical.wiki.service;

import com.medical.wiki.entity.Manual;
import com.medical.wiki.entity.Progress;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.ManualRepository;
import com.medical.wiki.repository.ProgressRepository;
import com.medical.wiki.repository.UserRepository;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplianceExportService {

    private final UserRepository userRepository;
    private final ManualRepository manualRepository;
    private final ProgressRepository progressRepository;
    private final com.medical.wiki.repository.FacilityRepository facilityRepository;

    /**
     * Get distinct facility list
     */
    public List<String> getDistinctFacilities() {
        return facilityRepository.findByDeletedAtIsNullOrderByNameAsc().stream()
                .map(com.medical.wiki.entity.Facility::getName)
                .collect(Collectors.toList());
    }

    /**
     * Export learning progress as CSV
     */
    public byte[] exportProgressCsv(String facility, LocalDate startDate, LocalDate endDate) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                OutputStreamWriter osw = new OutputStreamWriter(baos, StandardCharsets.UTF_8);
                CSVWriter writer = new CSVWriter(osw)) {

            // BOM for Excel compatibility
            baos.write(0xEF);
            baos.write(0xBB);
            baos.write(0xBF);

            List<User> users = getFilteredUsers(facility);
            List<Manual> manuals = manualRepository.findAll();
            Map<Long, Set<Long>> userProgressMap = buildUserProgressMap(users, startDate, endDate);

            // Header row: 職員ID, 氏名, 施設, 部署, [マニュアル名...], 完了率
            List<String> header = new ArrayList<>();
            header.add("職員ID");
            header.add("氏名");
            header.add("施設");
            header.add("部署");
            for (Manual manual : manuals) {
                header.add(manual.getTitle());
            }
            header.add("完了率");
            writer.writeNext(header.toArray(new String[0]));

            // Data rows
            for (User user : users) {
                List<String> row = new ArrayList<>();
                row.add(user.getEmployeeId());
                row.add(user.getName());
                row.add(user.getFacility());
                row.add(user.getDepartment());

                Set<Long> completedManualIds = userProgressMap.getOrDefault(user.getId(), Collections.emptySet());
                int completedCount = 0;

                for (Manual manual : manuals) {
                    if (completedManualIds.contains(manual.getId())) {
                        row.add("✔");
                        completedCount++;
                    } else {
                        row.add("-");
                    }
                }

                double completionRate = manuals.isEmpty() ? 0 : (double) completedCount / manuals.size() * 100;
                row.add(String.format("%.1f%%", completionRate));
                writer.writeNext(row.toArray(new String[0]));
            }

            writer.flush();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("CSV出力に失敗しました: " + e.getMessage(), e);
        }
    }

    private List<User> getFilteredUsers(String facility) {
        if (facility == null || facility.isBlank() || "all".equalsIgnoreCase(facility)) {
            return userRepository.findAllByDeletedAtIsNull();
        }
        return userRepository.findByFacilityAndDeletedAtIsNull(facility);
    }

    private Map<Long, Set<Long>> buildUserProgressMap(List<User> users, LocalDate startDate, LocalDate endDate) {
        List<Long> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        List<Progress> allProgress = progressRepository.findByUserIdIn(userIds);

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : LocalDateTime.MIN;
        LocalDateTime endDateTime = endDate != null ? endDate.plusDays(1).atStartOfDay() : LocalDateTime.MAX;

        return allProgress.stream()
                .filter(p -> p.getReadAt() != null)
                .filter(p -> !p.getReadAt().isBefore(startDateTime) && p.getReadAt().isBefore(endDateTime))
                .collect(Collectors.groupingBy(
                        p -> p.getUser().getId(),
                        Collectors.mapping(p -> p.getManual().getId(), Collectors.toSet())));
    }
}
