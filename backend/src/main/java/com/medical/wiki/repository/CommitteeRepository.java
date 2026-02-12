package com.medical.wiki.repository;

import com.medical.wiki.entity.Committee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CommitteeRepository extends JpaRepository<Committee, Long> {
    Optional<Committee> findByName(String name);
}
