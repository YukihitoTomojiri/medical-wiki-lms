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
            user.setPaidLeaveDays(user.getPaidLeaveDays() - daysRequested);
            userRepository.save(user);
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
    @Transactional
    public void grantPaidLeaveDays(Long targetUserId, Double daysToGrant, Long grantedById, String reason) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));
        User grantedBy = userRepository.findById(grantedById)
                .orElseThrow(() -> new RuntimeException("Granting user not found"));

        // Update user's balance
        targetUser.setPaidLeaveDays(targetUser.getPaidLeaveDays() + daysToGrant);
        userRepository.save(targetUser);

        // Record accrual history
        PaidLeaveAccrual accrual = PaidLeaveAccrual.builder()
                .user(targetUser)
                .daysGranted(daysToGrant)
                .grantedBy(grantedBy)
                .reason(reason)
                .build();
        accrualRepository.save(accrual);
    }

    /**
     * Get paid leave accrual history for a user
     */
    @Transactional(readOnly = true)
    public List<PaidLeaveAccrual> getAccrualHistory(Long userId) {
        return accrualRepository.findByUserIdAndDeletedAtIsNullOrderByGrantedAtDesc(userId);
    }
}
