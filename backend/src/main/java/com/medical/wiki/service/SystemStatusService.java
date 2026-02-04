package com.medical.wiki.service;

import org.springframework.stereotype.Service;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

@Service
public class SystemStatusService {

    public Map<String, Object> getResourceMetrics() {
        Runtime runtime = Runtime.getRuntime();

        // Memory Usage
        long maxMemory = runtime.maxMemory();
        long allocatedMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = allocatedMemory - freeMemory;

        double memoryUsagePercent = (double) usedMemory / maxMemory * 100;

        // Disk Usage (Root)
        File root = new File("/");
        long totalSpace = root.getTotalSpace();
        long freeSpace = root.getFreeSpace();
        long usedSpace = totalSpace - freeSpace;

        double diskUsagePercent = totalSpace > 0 ? (double) usedSpace / totalSpace * 100 : 0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("memoryUsed", usedMemory);
        metrics.put("memoryMax", maxMemory);
        metrics.put("memoryPercent", memoryUsagePercent);
        metrics.put("diskUsed", usedSpace);
        metrics.put("diskTotal", totalSpace);
        metrics.put("diskPercent", diskUsagePercent);
        metrics.put("diskFree", freeSpace);

        return metrics;
    }
}
