package com.medical.wiki.service;

import com.medical.wiki.entity.Committee;
import com.medical.wiki.repository.CommitteeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommitteeService {

    private final CommitteeRepository committeeRepository;

    public List<Committee> getAllCommittees() {
        return committeeRepository.findAll();
    }

    @Transactional
    public Committee createCommittee(String name, String description) {
        if (committeeRepository.findByName(name).isPresent()) {
            throw new RuntimeException("Committee with this name already exists");
        }
        Committee committee = Committee.builder()
                .name(name)
                .description(description)
                .build();
        return committeeRepository.save(committee);
    }
}
