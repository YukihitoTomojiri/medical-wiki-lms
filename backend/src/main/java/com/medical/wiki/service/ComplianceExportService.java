package com.medical.wiki.service;

import com.medical.wiki.entity.Manual;
import com.medical.wiki.entity.Progress;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.ManualRepository;
import com.medical.wiki.repository.ProgressRepository;
import com.medical.wiki.repository.UserRepository;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplianceExportService {

    private final UserRepository userRepository;
    private final ManualRepository manualRepository;
    private final ProgressRepository progressRepository;
    private final com.medical.wiki.repository.FacilityRepository facilityRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

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

            // Header row
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
            throw new RuntimeException("CSV export failed: " + e.getMessage(), e);
        }
    }

    /**
     * Export compliance report as PDF
     */
    public byte[] exportComplianceReport(String facility, LocalDate startDate, LocalDate endDate) {
        try (PDDocument document = new PDDocument();
                ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            List<User> users = getFilteredUsers(facility);
            List<Manual> manuals = manualRepository.findAll();
            Map<Long, Set<Long>> userProgressMap = buildUserProgressMap(users, startDate, endDate);

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            // Load Japanese font
            PDFont font;
            try (InputStream fontStream = new ClassPathResource("fonts/NotoSansJP-Regular.ttf").getInputStream()) {
                font = PDType0Font.load(document, fontStream);
            } catch (Exception e) {
                // Fallback for different environments
                java.io.File fontFile = new java.io.File("/app/src/main/resources/fonts/NotoSansJP-Regular.ttf");
                if (fontFile.exists()) {
                    try (java.io.FileInputStream fis = new java.io.FileInputStream(fontFile)) {
                        font = PDType0Font.load(document, fis);
                    }
                } else {
                    font = PDType1Font.HELVETICA;
                }
            }

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float yPosition = 750;
                float margin = 50;
                float lineHeight = 20;

                // Title
                contentStream.beginText();
                contentStream.setFont(font, 18);
                contentStream.newLineAtOffset(margin, yPosition);
                String title = "コンプライアンス遵守状況レポート";
                if (facility != null && !facility.isBlank() && !"all".equalsIgnoreCase(facility)) {
                    title += " - 対象施設: " + facility;
                }
                contentStream.showText(title);
                contentStream.endText();
                yPosition -= 30;

                // Report metadata
                contentStream.beginText();
                contentStream.setFont(font, 10);
                contentStream.newLineAtOffset(margin, yPosition);
                String dateRange = String.format("対象期間: %s 〜 %s",
                        startDate != null ? startDate.format(DATE_FORMATTER) : "制限なし",
                        endDate != null ? endDate.format(DATE_FORMATTER) : "現時点まで");
                contentStream.showText(dateRange);
                contentStream.endText();
                yPosition -= lineHeight;

                contentStream.beginText();
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("出力日時: " + LocalDateTime.now().format(DATETIME_FORMATTER));
                contentStream.endText();
                yPosition -= 30;

                // Summary statistics
                int totalUsers = users.size();
                int totalManuals = manuals.size();
                long completedUsers = users.stream()
                        .filter(u -> {
                            Set<Long> completed = userProgressMap.getOrDefault(u.getId(), Collections.emptySet());
                            return completed.size() == totalManuals && totalManuals > 0;
                        })
                        .count();

                double overallCompletionRate = 0;
                if (!users.isEmpty() && !manuals.isEmpty()) {
                    long totalPossible = (long) users.size() * manuals.size();
                    long totalCompleted = userProgressMap.values().stream().mapToLong(Set::size).sum();
                    overallCompletionRate = (double) totalCompleted / totalPossible * 100;
                }

                contentStream.beginText();
                contentStream.setFont(font, 12);
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("【集計サマリー】");
                contentStream.endText();
                yPosition -= lineHeight;

                String[] summaryLines = {
                        "全職員数: " + totalUsers + " 名",
                        "全マニュアル数: " + totalManuals + " 項目",
                        "全課程修了者数: " + completedUsers + " 名",
                        "全体進捗率: " + String.format("%.1f%%", overallCompletionRate)
                };

                contentStream.setFont(font, 10);
                for (String line : summaryLines) {
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin + 20, yPosition);
                    contentStream.showText(line);
                    contentStream.endText();
                    yPosition -= lineHeight;
                }

                yPosition -= 20;

                // User list
                contentStream.beginText();
                contentStream.setFont(font, 12);
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("【職員別進捗詳細】");
                contentStream.endText();
                yPosition -= lineHeight;

                contentStream.setFont(font, 9);
                int maxUsersPerPage = 25;
                int userCount = 0;

                for (User user : users) {
                    if (userCount >= maxUsersPerPage)
                        break;

                    Set<Long> completed = userProgressMap.getOrDefault(user.getId(), Collections.emptySet());
                    double rate = manuals.isEmpty() ? 0 : (double) completed.size() / manuals.size() * 100;

                    String userLine = String.format("%s (%s) - %s - 進捗率: %.0f%%",
                            user.getName(),
                            user.getEmployeeId(),
                            user.getDepartment(),
                            rate);

                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin + 20, yPosition);
                    contentStream.showText(userLine);
                    contentStream.endText();
                    yPosition -= lineHeight;
                    userCount++;
                }

                if (users.size() > maxUsersPerPage) {
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin + 20, yPosition);
                    contentStream.showText("... 他 " + (users.size() - maxUsersPerPage) + " 名の職員");
                    contentStream.endText();
                }
            }

            document.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("PDF export failed: " + e.getMessage(), e);
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
