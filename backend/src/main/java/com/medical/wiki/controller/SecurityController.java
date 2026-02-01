package com.medical.wiki.controller;

import com.medical.wiki.dto.SecurityAnomalyDto;
import com.medical.wiki.service.SecurityAnomalyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/security")
@RequiredArgsConstructor
public class SecurityController {

    private final SecurityAnomalyService securityAnomalyService;

    /**
     * セキュリティアラート一覧を取得
     */
    @GetMapping("/alerts")
    public ResponseEntity<List<SecurityAnomalyDto>> getAlerts(
            @RequestParam(defaultValue = "false") boolean openOnly) {
        List<SecurityAnomalyDto> alerts = openOnly
                ? securityAnomalyService.getOpenAlerts()
                : securityAnomalyService.getAllAlerts();
        return ResponseEntity.ok(alerts);
    }

    /**
     * アラート統計情報を取得
     */
    @GetMapping("/alerts/stats")
    public ResponseEntity<Map<String, Long>> getAlertStats() {
        return ResponseEntity.ok(securityAnomalyService.getAlertStats());
    }

    /**
     * アラートを確認済みにする
     */
    @PostMapping("/alerts/{id}/acknowledge")
    public ResponseEntity<SecurityAnomalyDto> acknowledgeAlert(@PathVariable Long id) {
        return ResponseEntity.ok(securityAnomalyService.acknowledgeAlert(id));
    }

    /**
     * アラートを解決済みにする
     */
    @PostMapping("/alerts/{id}/resolve")
    public ResponseEntity<SecurityAnomalyDto> resolveAlert(@PathVariable Long id) {
        return ResponseEntity.ok(securityAnomalyService.resolveAlert(id));
    }
}
