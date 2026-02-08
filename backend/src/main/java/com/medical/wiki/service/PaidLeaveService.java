package com.medical.wiki.service;

import com.medical.wiki.dto.PaidLeaveDto;
import com.medical.wiki.entity.PaidLeave;
import com.medical.wiki.entity.PaidLeaveAccrual;
import com.medical.wiki.entity.User;
import com.medical.wiki.entity.UserFacilityMapping;
import com.medical.wiki.repository.PaidLeaveAccrualRepository;
import com.medical.wiki.repository.PaidLeaveRepository;
import com.medical.wiki.repository.UserFacilityMappingRepository;
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
    private final UserFacilityMappingRepository facilityMappingRepository;
    private final PaidLeaveAccrualRepository accrualRepository;

    @Transactional
    public PaidLeaveDto submitRequest(Long userId, LocalDate startDate, LocalDate endDate, String reason,
            PaidLeave.LeaveType leaveType) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date must be before or equal to end date");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (repository.existsOverlapping(userId, startDate, endDate,
                java.util.Arrays.asList(PaidLeave.Status.PENDING, PaidLeave.Status.APPROVED))) {
            throw new IllegalArgumentException(startDate + "から" + endDate + "の期間は既に申請済みです");
        }

        // Calculate requested days based on leave type
        double baseDays = (double) java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
        double daysRequested = (leaveType == PaidLeave.LeaveType.FULL) ? baseDays : baseDays * 0.5;

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
                .leaveType(leaveType)
                .build();

        return PaidLeaveDto.fromEntity(repository.save(paidLeave));
    }

    @Transactional(readOnly = true)
    public List<PaidLeaveDto> getMyRequests(Long userId) {
        return repository.findByUserIdOrderByStartDateDesc(userId).stream()
                .map(PaidLeaveDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get all requests based on requester's role:
     * - DEVELOPER: ALL facilities
     * - ADMIN: Only facilities they manage (via user_facility_mapping)
     * - USER: Only their own (should use getMyRequests instead)
     */
    @Transactional(readOnly = true)
    public List<PaidLeaveDto> getAllRequests(Long requesterId) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        List<PaidLeave> leaves;
        if (requester.getRole() == User.Role.DEVELOPER) {
            // DEVELOPER: GLOBAL access
            leaves = repository.findByDeletedAtIsNullOrderByStartDateDesc();
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
            leaves = repository.findByUser_FacilityInAndDeletedAtIsNullOrderByStartDateDesc(managedFacilities);
        } else {
            // USER: SELF only (fallback)
            leaves = repository.findByUserIdOrderByStartDateDesc(requesterId);
        }

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
            double baseDays = java.time.temporal.ChronoUnit.DAYS.between(paidLeave.getStartDate(),
                    paidLeave.getEndDate()) + 1;
            double daysRequested = (paidLeave.getLeaveType() == PaidLeave.LeaveType.FULL) ? baseDays : baseDays * 0.5;
            User user = paidLeave.getUser();
            if (user.getPaidLeaveDays() < daysRequested) {
                throw new IllegalStateException("User has insufficient balance to approve this request");
            }
            // Approve first, then recalculate
            paidLeave.setStatus(status);
            repository.save(paidLeave);
            calculateCurrentBalance(user.getId());
            return PaidLeaveDto.fromEntity(paidLeave);
        } else if (status == PaidLeave.Status.REJECTED) {
            paidLeave.setRejectionReason(rejectionReason);
        }

        paidLeave.setStatus(status);
        return PaidLeaveDto.fromEntity(repository.save(paidLeave));
    }

    @Transactional
    public void bulkApprove(List<Long> ids) {
        for (Long id : ids) {
            updateStatus(id, PaidLeave.Status.APPROVED, null);
        }
    }

    /**
     * Grant paid leave days to a user (ADMIN/DEVELOPER only)
     */
    /**
     * Grant paid leave days to a user (ADMIN/DEVELOPER only)
     */
    @Transactional
    public void grantPaidLeaveDays(Long targetUserId, Double daysToGrant, Long grantedById, String reason) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));
        User grantedBy = userRepository.findById(grantedById)
                .orElseThrow(() -> new RuntimeException("Granting user not found"));

        // Record accrual history
        PaidLeaveAccrual accrual = PaidLeaveAccrual.builder()
                .user(targetUser)
                .daysGranted(daysToGrant)
                .grantedBy(grantedBy)
                .reason(reason)
                .grantedAt(java.time.LocalDateTime.now())
                .deadline(LocalDate.now().plusYears(2)) // Default 2 years expiration
                .build();
        accrualRepository.save(accrual);

        // Recalculate balance
        calculateCurrentBalance(targetUserId);
    }

    /**
     * Get paid leave accrual history for a user
     */
    @Transactional(readOnly = true)
    public List<PaidLeaveAccrual> getAccrualHistory(Long userId) {
        return accrualRepository.findByUserIdAndDeletedAtIsNullOrderByGrantedAtDesc(userId);
    }

    @Transactional
    public void grantMissingAccruals(User user) {
        if (user.getJoinedDate() == null)
            return;
        LocalDate joinedDate = user.getJoinedDate();
        LocalDate now = LocalDate.now();

        // 50 years max loop
        for (int i = 0; i < 50; i++) {
            LocalDate grantDate = joinedDate.plusMonths(6).plusYears(i);
            if (grantDate.isAfter(now)) {
                break;
            }

            // Check if grant exists for this specific date (approximate check by deadline)
            // Deadline = GrantDate + 2 years.
            LocalDate expectedDeadline = grantDate.plusYears(2);

            boolean exists = accrualRepository.findByUserIdAndDeletedAtIsNullOrderByGrantedAtDesc(user.getId()).stream()
                    .anyMatch(a -> a.getDeadline() != null && a.getDeadline().equals(expectedDeadline));

            if (!exists) {
                double days = 0;
                if (i == 0)
                    days = 10;
                else if (i == 1)
                    days = 11;
                else if (i == 2)
                    days = 12;
                else if (i == 3)
                    days = 14;
                else if (i == 4)
                    days = 16;
                else if (i == 5)
                    days = 18;
                else
                    days = 20;

                PaidLeaveAccrual accrual = PaidLeaveAccrual.builder()
                        .user(user)
                        .daysGranted(days)
                        .grantedAt(grantDate.atStartOfDay())
                        .deadline(expectedDeadline)
                        .reason("Automatic Grant (" + (i + 0.5) + " years)")
                        .build();
                accrualRepository.save(accrual);
            }
        }
    }

    @Transactional
    public com.medical.wiki.dto.PaidLeaveStatusDto calculateCurrentBalance(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Ensure Grants
        grantMissingAccruals(user);

        // 2. Load Data
        List<PaidLeaveAccrual> accruals = accrualRepository.findByUserIdAndDeletedAtIsNullOrderByGrantedAtAsc(userId);
        List<PaidLeave> approvedLeaves = repository.findByUserIdAndStatusOrderByStartDateAsc(userId,
                PaidLeave.Status.APPROVED);

        // 3. Bucket Simulation
        class AccrualBucket {
            Double remaining;
            LocalDate grantDate;
            LocalDate deadline;

            public AccrualBucket(PaidLeaveAccrual a) {
                this.remaining = a.getDaysGranted();
                this.grantDate = a.getGrantedAt().toLocalDate();
                this.deadline = a.getDeadline() != null ? a.getDeadline() : a.getGrantedAt().toLocalDate().plusYears(2);
            }
        }

        List<AccrualBucket> buckets = accruals.stream().map(AccrualBucket::new).collect(Collectors.toList());

        for (PaidLeave leave : approvedLeaves) {
            double baseDays = (double) java.time.temporal.ChronoUnit.DAYS.between(leave.getStartDate(),
                    leave.getEndDate()) + 1;
            double needed = (leave.getLeaveType() == PaidLeave.LeaveType.FULL) ? baseDays : baseDays * 0.5;

            while (needed > 0) {
                // Find earliest valid bucket for this leave
                LocalDate leaveDate = leave.getStartDate();
                AccrualBucket bucket = buckets.stream()
                        .filter(b -> !b.grantDate.isAfter(leaveDate) && b.deadline.isAfter(leaveDate)
                                && b.remaining > 0)
                        .findFirst()
                        .orElse(null);

                if (bucket == null) {
                    // No valid grant found (legacy or overdrawn). Ignore deduct.
                    break;
                }

                double deduct = Math.min(bucket.remaining, needed);
                bucket.remaining -= deduct;
                needed -= deduct;
            }
        }

        // 4. Sum remaining valid buckets
        LocalDate today = LocalDate.now();
        double remaining = buckets.stream()
                .filter(b -> b.deadline.isAfter(today))
                .mapToDouble(b -> b.remaining)
                .sum();

        // Update Entity
        user.setPaidLeaveDays(remaining);
        userRepository.save(user);

        // 5. Next Grant Info
        LocalDate nextGrantDate = null;
        Double nextGrantDays = 0.0;

        if (user.getJoinedDate() != null) {
            for (int i = 0; i < 50; i++) {
                LocalDate d = user.getJoinedDate().plusMonths(6).plusYears(i);
                if (d.isAfter(today)) {
                    nextGrantDate = d;
                    if (i == 0)
                        nextGrantDays = 10.0;
                    else if (i == 1)
                        nextGrantDays = 11.0;
                    else if (i == 2)
                        nextGrantDays = 12.0;
                    else if (i == 3)
                        nextGrantDays = 14.0;
                    else if (i == 4)
                        nextGrantDays = 16.0;
                    else if (i == 5)
                        nextGrantDays = 18.0;
                    else
                        nextGrantDays = 20.0;
                    break;
                }
            }
        }

        // 6. Compliance Check (5 days rule)
        Double obligatoryDaysTaken = 0.0;
        Double obligatoryTarget = 5.0;
        Boolean isObligationMet = false;
        Boolean isWarning = false;
        Double daysRemainingToObligation = 5.0;

        if (nextGrantDate != null && user.getJoinedDate() != null) {
            LocalDate firstGrantDate = user.getJoinedDate().plusMonths(6);
            LocalDate currentCycleStart = nextGrantDate.minusYears(1);

            // Valid cycle check: must be at least the first grant date
            if (!currentCycleStart.isBefore(firstGrantDate)) {
                for (PaidLeave leave : approvedLeaves) {
                    // Count if start date is within current cycle [currentCycleStart,
                    // nextGrantDate)
                    if (leave.getStartDate().isAfter(currentCycleStart.minusDays(1))
                            && leave.getStartDate().isBefore(nextGrantDate)) {
                        double baseDays = (double) java.time.temporal.ChronoUnit.DAYS.between(leave.getStartDate(),
                                leave.getEndDate()) + 1;
                        double days = (leave.getLeaveType() == PaidLeave.LeaveType.FULL) ? baseDays : baseDays * 0.5;
                        obligatoryDaysTaken += days;
                    }
                }

                isObligationMet = obligatoryDaysTaken >= obligatoryTarget;
                daysRemainingToObligation = Math.max(0.0, obligatoryTarget - obligatoryDaysTaken);

                // Warning: Met=False AND > 9 months passed in cycle
                long monthsPassed = java.time.temporal.ChronoUnit.MONTHS.between(currentCycleStart, today);
                if (!isObligationMet && monthsPassed >= 9) {
                    isWarning = true;
                }
            } else {
                // Before first grant -> No obligation yet
                obligatoryTarget = 0.0;
                daysRemainingToObligation = 0.0;
                isObligationMet = true;
            }
        }

        return com.medical.wiki.dto.PaidLeaveStatusDto.builder()
                .remainingDays(remaining)
                .nextGrantDate(nextGrantDate)
                .nextGrantDays(nextGrantDays)
                .obligatoryDaysTaken(obligatoryDaysTaken)
                .obligatoryTarget(obligatoryTarget)
                .isObligationMet(isObligationMet)
                .isWarning(isWarning)
                .daysRemainingToObligation(daysRemainingToObligation)
                .build();
    }

    /**
     * Fix balance consistency for all users (Admin only)
     */
    @Transactional
    public void fixBalanceConsistency() {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            calculateCurrentBalance(user.getId());
        }
    }

    /**
     * Demo Data Initialization
     * Ensures honkan001 has joinedDate set for testing paid leave logic.
     */
    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    @Transactional
    public void initDemoData() {
        userRepository.findByEmployeeIdAndDeletedAtIsNull("honkan001").ifPresent(user -> {
            boolean updated = false;
            // Set joined date to 2024-04-01 (approx 2 years ago from 2026, or exactly 1.5y
            // if 2025)
            // Current time in simulation is 2026-02-08.
            // If joined 2024-04-01:
            // 2024-10-01 (0.5y) -> Grant 10 days. Deadline 2026-10-01. Valid.
            // 2025-10-01 (1.5y) -> Grant 11 days. Deadline 2027-10-01. Valid.
            // Total = 21 days - used.
            if (user.getJoinedDate() == null) {
                user.setJoinedDate(LocalDate.of(2024, 4, 1));
                updated = true;
            }
            // Always recalculate to ensure grants exist
            calculateCurrentBalance(user.getId());
            if (updated) {
                userRepository.save(user);
            }
        });
    }
}
