package com.medical.wiki.service;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.Period;

@Service
public class LeaveCalculationService {

    /**
     * Calculates Japan's statutory paid leave grant based on tenure.
     * Table for full-time employees:
     * 0.5y -> 10 days
     * 1.5y -> 11 days
     * 2.5y -> 12 days
     * 3.5y -> 14 days
     * 4.5y -> 16 days
     * 5.5y -> 18 days
     * 6.5y+ -> 20 days
     */
    public double calculateStatutoryAmount(LocalDate joinedDate, LocalDate referenceDate) {
        if (joinedDate == null)
            return 0.0;

        Period period = Period.between(joinedDate, referenceDate);
        int years = period.getYears();
        int months = period.getMonths();
        double totalMonths = years * 12 + months;

        if (totalMonths < 6)
            return 0.0;
        if (totalMonths < 18)
            return 10.0;
        if (totalMonths < 30)
            return 11.0;
        if (totalMonths < 42)
            return 12.0;
        if (totalMonths < 54)
            return 14.0;
        if (totalMonths < 66)
            return 16.0;
        if (totalMonths < 78)
            return 18.0;
        return 20.0;
    }

    public double calculateStatutoryAmount(LocalDate joinedDate) {
        return calculateStatutoryAmount(joinedDate, LocalDate.now());
    }
}
