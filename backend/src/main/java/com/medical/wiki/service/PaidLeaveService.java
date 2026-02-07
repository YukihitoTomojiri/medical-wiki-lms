package com.medical.wiki.service;

import com.medical.wiki.dto.PaidLeaveDto;
import com.medical.wiki.dto.UserDto;
import com.medical.wiki.entity.PaidLeave;
import com.medical.wiki.entity.User;
import com.medical.wiki.repository.PaidLeaveRepository;
import com.medical.wiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaidLeaveService {

    private final PaidLeaveRepository repository;
    private final UserRepository userRepository;
    private final LeaveCalculationService leaveCalculationService;
    private final com.medical.wiki.repository.AttendanceRequestRepository attendanceRequestRepository;

    @Transactional
    public PaidLeaveDto submitRequest(Long userId, LocalDate startDate, LocalDate endDate, String reason) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date must be before or equal to end date");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Calculate requested days
        double daysRequested = (double) java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;

        // Check balance (Simplified: Assuming single day excluding weekends is not
        // required yet, just pure date diff)
        // If strictly business days, we need more logic. For MVP/prototype, date diff
        // is fine.
        if (user.getPaidLeaveDays() < daysRequested) {
            throw new IllegalArgumentException("Insufficient paid leave balance. Requested: " + daysRequested
                    + ", Available: " + user.getPaidLeaveDays());
        }

        PaidLeave paidLeave = PaidLeave.builder()
                .user(user)
                .startDate(startDate)
                .endDate(endDate)
                .reason(reason)
                .status(PaidLeave.Status.PENDING)
                .build();

        return PaidLeaveDto.fromEntity(repository.save(paidLeave));
    }

    @Transactional(readOnly = true)
    public List<PaidLeaveDto> getMyRequests(Long userId) {
        return repository.findByUserIdOrderByStartDateDesc(userId).stream()
                .map(PaidLeaveDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaidLeaveDto> getAllRequests(Long requesterId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        System.out.println("Processing getAllRequests for User: " + requester.getId() + ", Role: " + requester.getRole()
                + ", Facility: " + requester.getFacility());

        List<PaidLeave> leaves;
        if (requester.getRole() == User.Role.DEVELOPER
                || requester.getRole() == User.Role.ADMIN && "ALL".equals(requester.getFacility())) {
            // DEVELOPER (or global ADMIN if we had one) sees ALL
            System.out.println("User is DEVELOPER. Fetching ALL requests.");
            leaves = repository.findAllByOrderByStartDateDesc();
        } else {
            // Normal ADMIN sees Facility only
            System.out.println("User is ADMIN/USER. Fetching facility requests: " + requester.getFacility());
            leaves = repository.findByUserFacilityOrderByStartDateDesc(requester.getFacility());
        }

        System.out.println("Found " + leaves.size() + " leaves.");

        return leaves.stream()
                .map(PaidLeaveDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaidLeaveDto updateStatus(Long id, PaidLeave.Status status, String rejectionReason) {
        PaidLeave paidLeave = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (paidLeave.getStatus() != PaidLeave.Status.PENDING) {
            throw new IllegalStateException("Can only update PENDING requests");
        }

        if (status == PaidLeave.Status.APPROVED) {
            double daysRequested = java.time.temporal.ChronoUnit.DAYS.between(paidLeave.getStartDate(),
                    paidLeave.getEndDate()) + 1;
            User user = paidLeave.getUser();
            double currentBalance = calculateRemainingDays(user.getId());
            if (currentBalance < daysRequested) {
                throw new IllegalStateException("User has insufficient balance to approve this request");
            }
            // Logic change: We no longer manually subtract from user.paidLeaveDays here
            // because calculateRemainingDays is dynamic based on approved requests.
            // But we might want to update the cache field in User table for performance.
            user.setPaidLeaveDays(currentBalance - daysRequested);
            userRepository.save(user);
        } else if (status == PaidLeave.Status.REJECTED) {
            paidLeave.setRejectionReason(rejectionReason);
        }

        paidLeave.setStatus(status);
        return PaidLeaveDto.fromEntity(repository.save(paidLeave));
    }

    public double calculateUsedDays(Long userId) {
        // From PaidLeave entities
        double fromPaidLeaves = repository.findByUserIdAndStatus(userId, PaidLeave.Status.APPROVED).stream()
                .mapToDouble(pl -> java.time.temporal.ChronoUnit.DAYS.between(pl.getStartDate(), pl.getEndDate()) + 1)
                .sum();

        // From AttendanceRequest entities
        double fromAttendanceRequests = attendanceRequestRepository
                .findByUserIdAndStatus(userId, com.medical.wiki.entity.AttendanceRequest.Status.APPROVED).stream()
                .filter(ar -> ar.getType() == com.medical.wiki.entity.AttendanceRequest.RequestType.PAID_LEAVE)
                .mapToDouble(ar -> {
                    long baseDays = java.time.temporal.ChronoUnit.DAYS.between(ar.getStartDate(), ar.getEndDate()) + 1;
                    if (ar.getDurationType() == com.medical.wiki.entity.AttendanceRequest.DurationType.FULL_DAY) {
                        return (double) baseDays;
                    } else {
                        // Assuming half-day requests are usually for a single date in this system
                        return baseDays * 0.5;
                    }
                })
                .sum();

        return fromPaidLeaves + fromAttendanceRequests;
    }

    public double calculateStatutoryEntitlement(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return leaveCalculationService.calculateStatutoryAmount(user.getJoinedDate());
    }

    public double calculateTotalEntitlement(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return calculateStatutoryEntitlement(userId)
                + (user.getInitialAdjustmentDays() != null ? user.getInitialAdjustmentDays() : 0.0);
    }

    public double calculateRemainingDays(Long userId) {
        return calculateTotalEntitlement(userId) - calculateUsedDays(userId);
    }

    public void enrichUserDto(UserDto dto) {
        if (dto.getId() == null)
            return;
        double statutory = calculateStatutoryEntitlement(dto.getId());
        double used = calculateUsedDays(dto.getId());
        double total = statutory + (dto.getInitialAdjustmentDays() != null ? dto.getInitialAdjustmentDays() : 0.0);

        dto.setStatutoryLeaveDays(statutory);
        dto.setUsedLeaveDays(used);
        dto.setRemainingLeaveDays(total - used);
        dto.setPaidLeaveDays(total - used); // Synced
    }

    @Transactional(readOnly = true)
    public long getPendingCount(Long requesterId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        if (requester.getRole() == User.Role.DEVELOPER) {
            return repository.countByStatus(PaidLeave.Status.PENDING);
        } else {
            return repository.countByUserFacilityAndStatus(requester.getFacility(), PaidLeave.Status.PENDING);
        }
    }
}
