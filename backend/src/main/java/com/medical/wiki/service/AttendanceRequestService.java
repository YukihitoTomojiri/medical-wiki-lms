package com.medical.wiki.service;

import com.medical.wiki.dto.AttendanceRequestDto;
import com.medical.wiki.entity.AttendanceRequest;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.AttendanceRequestRepository;
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

        // Helper to calculate days for balance check
        double daysRequested = calculateDays(type, durationType, startDate, endDate);

        // Balance Check Logic for PAID_LEAVE
        if (type == AttendanceRequest.RequestType.PAID_LEAVE) {
            if (user.getPaidLeaveDays() < daysRequested) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Insufficient paid leave balance. Requested: " + daysRequested
                                + ", Available: " + user.getPaidLeaveDays());
            }
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
        if (type != AttendanceRequest.RequestType.PAID_LEAVE)
            return 0;

        long dateDiff = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;

        if (dateDiff == 1 && (durationType == AttendanceRequest.DurationType.HALF_DAY_AM
                || durationType == AttendanceRequest.DurationType.HALF_DAY_PM)) {
            return 0.5;
        }

        return (double) dateDiff;
    }

    @Transactional(readOnly = true)
    public List<AttendanceRequestDto> getMyRequests(Long userId) {
        return repository.findByUserIdOrderByStartDateDesc(userId).stream()
                .map(AttendanceRequestDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceRequestDto> getAllRequests(Long requesterId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        List<AttendanceRequest> requests;
        if (requester.getRole() == User.Role.DEVELOPER) {
            requests = repository.findAllByOrderByStartDateDesc();
        } else {
            requests = repository.findByUserFacilityOrderByStartDateDesc(requester.getFacility());
        }

        return requests.stream()
                .map(AttendanceRequestDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getPendingCount(Long requesterId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        if (requester.getRole() == User.Role.DEVELOPER) {
            return repository.countByStatus(AttendanceRequest.Status.PENDING);
        } else {
            return repository.countByUserFacilityAndStatus(requester.getFacility(), AttendanceRequest.Status.PENDING);
        }
    }

    @Transactional
    public AttendanceRequestDto updateStatus(Long id, AttendanceRequest.Status status, String rejectionReason) {
        AttendanceRequest request = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != AttendanceRequest.Status.PENDING) {
            throw new IllegalStateException("Can only update PENDING requests");
        }

        if (status == AttendanceRequest.Status.APPROVED) {
            // Deduct Logic
            if (request.getType() == AttendanceRequest.RequestType.PAID_LEAVE) {
                double daysRequested = calculateDays(request.getType(), request.getDurationType(),
                        request.getStartDate(), request.getEndDate());
                User user = request.getUser();
                if (user.getPaidLeaveDays() < daysRequested) {
                    throw new IllegalStateException("User has insufficient balance to approve this request");
                }
                user.setPaidLeaveDays(user.getPaidLeaveDays() - daysRequested);
                userRepository.save(user);
            }
        } else if (status == AttendanceRequest.Status.REJECTED) {
            request.setRejectionReason(rejectionReason);
        }

        request.setStatus(status);
        return AttendanceRequestDto.fromEntity(repository.save(request));
    }
}
