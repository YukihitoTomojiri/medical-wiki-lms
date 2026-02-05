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
    public PaidLeaveDto submitRequest(Long userId, LocalDate date, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PaidLeave paidLeave = PaidLeave.builder()
                .user(user)
                .date(date)
                .reason(reason)
                .status(PaidLeave.Status.PENDING)
                .build();

        return PaidLeaveDto.fromEntity(repository.save(paidLeave));
    }

    @Transactional(readOnly = true)
    public List<PaidLeaveDto> getMyRequests(Long userId) {
        return repository.findByUserIdOrderByDateDesc(userId).stream()
                .map(PaidLeaveDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaidLeaveDto> getAllRequests() {
        return repository.findAllByOrderByDateDesc().stream()
                .map(PaidLeaveDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaidLeaveDto updateStatus(Long id, PaidLeave.Status status) {
        PaidLeave paidLeave = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        paidLeave.setStatus(status);
        return PaidLeaveDto.fromEntity(repository.save(paidLeave));
    }
}
