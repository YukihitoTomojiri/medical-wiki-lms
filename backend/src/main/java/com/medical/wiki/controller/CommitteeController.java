package com.medical.wiki.controller;

import com.medical.wiki.entity.Committee;
import com.medical.wiki.service.CommitteeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/committees")
@RequiredArgsConstructor
public class CommitteeController {

    private final CommitteeService committeeService;

    @GetMapping
    public List<Committee> getAllCommittees() {
        return committeeService.getAllCommittees();
    }

    @PostMapping
    public ResponseEntity<Committee> createCommittee(@RequestBody Committee committee) {
        return ResponseEntity.ok(committeeService.createCommittee(committee.getName(), committee.getDescription()));
    }
}
