package com.medical.wiki.service;

import com.medical.wiki.dto.AttendanceRequestDto;
import com.medical.wiki.entity.AttendanceRequest;
import com.medical.wiki.entity.User;
import com.medical.wiki.entity.UserFacilityMapping;
import com.medical.wiki.repository.AttendanceRequestRepository;
import com.medical.wiki.repository.UserFacilityMappingRepository;
import com.medical.wiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class AttendanceRequestService {

    private final AttendanceRequestRepository repository;
    private final UserRepository userRepository;
    private final UserFacilityMappingRepository facilityMappingRepository;

    @Transactional
    public AttendanceRequestDto submitRequest(Long userId, AttendanceRequest.RequestType type,
            AttendanceRequest.DurationType durationType, LocalDate startDate, LocalDate endDate, LocalTime startTime,
            LocalTime endTime, String reason) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date must be before or equal to end date");
        }

        // Validate time inputs for specific types
        if ((type == AttendanceRequest.RequestType.LATE || type == AttendanceRequest.RequestType.EARLY_DEPARTURE)
                && startTime == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Start time is required for Late/Early Departure requests.");
        }
        // Basic time order validation if both are present
        if (startTime != null && endTime != null && startTime.isAfter(endTime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time cannot be after end time");
        }
        // 15-minute interval validation (Only for Late/Early Departure)
        if (type == AttendanceRequest.RequestType.LATE || type == AttendanceRequest.RequestType.EARLY_DEPARTURE) {
            if (startTime != null && startTime.getMinute() % 15 != 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Start time must be in 15-minute intervals (00, 15, 30, 45).");
            }
            if (endTime != null && endTime.getMinute() % 15 != 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "End time must be in 15-minute intervals (00, 15, 30, 45).");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Balance Check Logic for PAID_LEAVE - MOVED TO PaidLeaveService
        if (type == AttendanceRequest.RequestType.PAID_LEAVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Paid leave requests must be submitted through the dedicated /leaves/apply endpoint.");
        }

        AttendanceRequest request = AttendanceRequest.builder()
                .user(user)
                .type(type)
                .durationType(type == AttendanceRequest.RequestType.PAID_LEAVE ? durationType : null)
                .startDate(startDate)
                .endDate(endDate)
                .startTime(startTime)
                .endTime(endTime)
                .reason(reason)
                .status(AttendanceRequest.Status.PENDING)
                .build();

        return AttendanceRequestDto.fromEntity(repository.save(request));
    }

    private double calculateDays(AttendanceRequest.RequestType type, AttendanceRequest.DurationType durationType,
            LocalDate startDate, LocalDate endDate) {
        // PAID_LEAVE calculation logic moved to PaidLeaveService
        return 0;
    }

    @Transactional(readOnly = true)
    public List<AttendanceRequestDto> getMyRequests(Long userId) {
        return repository.findByUserIdOrderByStartDateDesc(userId).stream()
                .map(AttendanceRequestDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get all requests based on requester's role:
     * - DEVELOPER: ALL facilities (global access)
     * - ADMIN: Only facilities they manage (via user_facility_mapping)
     * - USER: Only their own (should use getMyRequests instead)
     */
    @Transactional(readOnly = true)
    public List<AttendanceRequestDto> getAllRequests(Long requesterId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        List<AttendanceRequest> requests;
        if (requester.getRole() == User.Role.DEVELOPER) {
            // DEVELOPER: GLOBAL access - bypass facility filter
            requests = repository.findByDeletedAtIsNullOrderByStartDateDesc();
        } else if (requester.getRole() == User.Role.ADMIN) {
            // ADMIN: Access only to facilities they manage
            List<String> managedFacilities = facilityMappingRepository
                    .findByUserIdAndDeletedAtIsNull(requesterId)
                    .stream()
                    .map(UserFacilityMapping::getFacilityName)
                    .collect(Collectors.toList());
            // Add their own facility if not already there
            if (!managedFacilities.contains(requester.getFacility())) {
                managedFacilities.add(requester.getFacility());
            }
            requests = repository.findByUser_FacilityInAndDeletedAtIsNullOrderByStartDateDesc(managedFacilities);
        } else {
            // USER: SELF only (fallback)
            requests = repository.findByUserIdOrderByStartDateDesc(requesterId);
        }

        return requests.stream()
                .map(AttendanceRequestDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendanceRequestDto updateStatus(Long id, AttendanceRequest.Status status, String rejectionReason) {
        AttendanceRequest request = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != AttendanceRequest.Status.PENDING) {
            throw new IllegalStateException("Can only update PENDING requests");
        }

        if (status == AttendanceRequest.Status.APPROVED) {
            // Deduct Logic - MOVED TO PaidLeaveService for PAID_LEAVE types.
            // Other types (ABSENCE, LATE, etc.) don't currently deduct days.
        } else if (status == AttendanceRequest.Status.REJECTED) {
            request.setRejectionReason(rejectionReason);
        }

        request.setStatus(status);
        return AttendanceRequestDto.fromEntity(repository.save(request));
    }
}
