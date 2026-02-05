package com.medical.wiki.service;

import com.medical.wiki.dto.PaidLeaveDto;
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
    public List<PaidLeaveDto> getAllRequests() {
        return repository.findAllByOrderByStartDateDesc().stream()
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
}
