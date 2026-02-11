package com.medical.wiki.service;

import com.medical.wiki.entity.Announcement;
import com.medical.wiki.entity.Facility;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.AnnouncementRepository;
import com.medical.wiki.repository.FacilityRepository;
import com.medical.wiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final FacilityRepository facilityRepository;

    // Get active announcements for a specific user (Dashboard view)
    @Transactional(readOnly = true)
    public List<Announcement> getAnnouncementsForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long facilityId = null;
        if (user.getFacility() != null && !user.getFacility().isEmpty()) {
            Facility facility = facilityRepository.findByNameAndDeletedAtIsNull(user.getFacility())
                    .orElse(null);
            if (facility != null) {
                facilityId = facility.getId();
            }
        }

        return announcementRepository.findActiveAnnouncements(facilityId, LocalDate.now());
    }

    // Get announcements for management (Admin view)
    public List<Announcement> getManageableAnnouncements(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.DEVELOPER) {
            return announcementRepository.findByFacilityIdIsNullAndDeletedAtIsNullOrderByCreatedAtDesc();
        } else {
            // Admin
            if (user.getFacility() == null || user.getFacility().isEmpty()) {
                return List.of();
            }
            Facility facility = facilityRepository.findByNameAndDeletedAtIsNull(user.getFacility())
                    .orElseThrow(() -> new RuntimeException("Admin facility not found"));
            return announcementRepository.findByFacilityIdAndDeletedAtIsNullOrderByCreatedAtDesc(facility.getId());
        }
    }

    @Transactional
    public Announcement createAnnouncement(Long userId, String title, String content,
            Announcement.Priority priority, LocalDate displayUntil, Long targetFacilityId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // RBAC Check
        if (user.getRole() == User.Role.ADMIN) {
            if (user.getFacility() == null || user.getFacility().isEmpty()) {
                throw new RuntimeException("Admin user has no facility assigned.");
            }
            // Admin can only create for their own facility
            Facility facility = facilityRepository.findByNameAndDeletedAtIsNull(user.getFacility())
                    .orElseThrow(() -> new RuntimeException("Admin facility not found"));
            targetFacilityId = facility.getId();
        } else if (user.getRole() == User.Role.DEVELOPER) {
            // Developer - targetFacilityId can be null (Global) or specific if they pass
            // it.
        } else {
            throw new RuntimeException("Unauthorized");
        }

        Announcement announcement = Announcement.builder()
                .title(title)
                .content(content)
                .priority(priority)
                .displayUntil(displayUntil)
                .facilityId(targetFacilityId)
                .createdBy(user)
                .build();

        return announcementRepository.save(announcement);
    }

    @Transactional
    public Announcement updateAnnouncement(Long userId, Long announcementId, String title, String content,
            Announcement.Priority priority, LocalDate displayUntil) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));

        // Permission check
        if (user.getRole() == User.Role.ADMIN) {
            Facility facility = facilityRepository.findByNameAndDeletedAtIsNull(user.getFacility())
                    .orElseThrow(() -> new RuntimeException("Admin facility not found"));

            if (!facility.getId().equals(announcement.getFacilityId())) {
                throw new RuntimeException("Unauthorized to edit this announcement");
            }
        } else if (user.getRole() == User.Role.DEVELOPER) {
            // Allowed to edit Global
        } else {
            throw new RuntimeException("Unauthorized");
        }

        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setPriority(priority);
        announcement.setDisplayUntil(displayUntil);

        return announcementRepository.save(announcement);
    }

    @Transactional
    public void deleteAnnouncement(Long userId, Long announcementId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));

        // Permission check
        if (user.getRole() == User.Role.ADMIN) {
            Facility facility = facilityRepository.findByNameAndDeletedAtIsNull(user.getFacility())
                    .orElseThrow(() -> new RuntimeException("Admin facility not found"));

            if (!facility.getId().equals(announcement.getFacilityId())) {
                throw new RuntimeException("Unauthorized to delete this announcement");
            }
        }

        announcement.setDeletedAt(LocalDateTime.now());
        announcementRepository.save(announcement);
    }
}
