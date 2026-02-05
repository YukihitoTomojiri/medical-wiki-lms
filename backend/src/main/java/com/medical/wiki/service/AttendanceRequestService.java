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
            throw new IllegalArgumentException("Start time is required for Late/Early Departure requests.");
        }
        // Basic time order validation if both are present
        if (startTime != null && endTime != null && startTime.isAfter(endTime)) {
            throw new IllegalArgumentException("Start time cannot be after end time");
        }
        // 15-minute interval validation
        if (startTime != null && startTime.getMinute() % 15 != 0) {
            throw new IllegalArgumentException("Start time must be in 15-minute intervals (00, 15, 30, 45).");
        }
        if (endTime != null && endTime.getMinute() % 15 != 0) {
            throw new IllegalArgumentException("End time must be in 15-minute intervals (00, 15, 30, 45).");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Helper to calculate days for balance check
        double daysRequested = calculateDays(type, durationType, startDate, endDate);

        // Balance Check Logic for PAID_LEAVE
        if (type == AttendanceRequest.RequestType.PAID_LEAVE) {
            if (user.getPaidLeaveDays() < daysRequested) {
                throw new IllegalArgumentException("Insufficient paid leave balance. Requested: " + daysRequested
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
    public List<AttendanceRequestDto> getAllRequests() {
        return repository.findAllByOrderByStartDateDesc().stream()
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
            // Deduct Logic
            if (request.getType() == AttendanceRequest.RequestType.PAID_LEAVE) {
                double daysRequested = calculateDays(request.getType(), request.getDurationType(),
                        request.getStartDate(), request.getEndDate());
                User user = request.getUser();
                if (user.getPaidLeaveDays() < daysRequested) {
                    throw new IllegalStateException("User has insufficient balance to approve this request");
                }
                // Assuming paidLeaveDays is Integer, we might need to change it to Double or
                // handle half days carefully.
                // Since DB `paid_leave_days` is int, and user asked for "Half Day" support...
                // Option A: Change DB to Float/Double.
                // Option B: Store as `0.5` days but represented in Int? No.
                // I should assume the requirement implies upgrading the balance system or
                // rounding.
                // Given the instructions, I'll update User entity to store days as Double or
                // handle floor/ceil.
                // Since I cannot change User entity table easily without migration (though I
                // can with `jpa`), let's assume `paidLeaveDays` is strictly Int for now and
                // fail?
                // Wait, if I implement 0.5 logic, `paidLeaveDays` MUST be double.
                // Let's modify User entity type in next step if generic Int is insufficient.
                // ACTUALLY, I will floor it for now: 20 - 0.5 = 19.5 -> 19? Or maybe I should
                // update User entity to double now.
                // Let's update `User.java` to use Double for `paidLeaveDays` if possible, OR
                // just subtract 1 for now if lazy.
                // But `HALF_DAY` implies 0.5.
                // I will update User to Double. It is a necessary change.

                // For now in this file, I'll cast but notice the Entity is Integer.
                // I'll update the User entity in the next tool call to Double.

                // Let's assume User is being updated to Double.
                // But wait, `User` entity is `Integer`.
                // I will add a `TODO` or handle it by casting to int (ceil) for safety or error
                // if not divisible?
                // Actually, let's just create a new tool call to update User entity to Double.
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
