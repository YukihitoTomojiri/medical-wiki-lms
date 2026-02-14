package com.medical.wiki.service;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.Period;

@Service
public class PaidLeaveCalculationService {

    /**
     * Calc grant days based on months worked since hired_at.
     * Table:
     * 0.5y (6m): 10 days
     * 1.5y (18m): 11 days
     * 2.5y (30m): 12 days
     * 3.5y (42m): 14 days
     * 4.5y (54m): 16 days
     * 5.5y (66m): 18 days
     * 6.5y+ (78m+): 20 days
     */
    public double calculateGrantDays(int monthsWorked) {
        if (monthsWorked < 6)
            return 0.0;
        if (monthsWorked < 18)
            return 10.0;
        if (monthsWorked < 30)
            return 11.0;
        if (monthsWorked < 42)
            return 12.0;
        if (monthsWorked < 54)
            return 14.0;
        if (monthsWorked < 66)
            return 16.0;
        if (monthsWorked < 78)
            return 18.0;
        return 20.0;
    }

    /**
     * Returns true if today is a grant day (0.5y, 1.5y, ... from hiredAt).
     */
    public boolean isGrantDay(LocalDate hiredAt, LocalDate today) {
        if (hiredAt == null || today == null)
            return false;

        // Grant day is hiredAt + (6 months + N years)
        // Check if today matches the month and day of hiredAt + 6 months
        LocalDate baseGrantDate = hiredAt.plusMonths(6);

        return today.getMonth() == baseGrantDate.getMonth() &&
                today.getDayOfMonth() == baseGrantDate.getDayOfMonth() &&
                !today.isBefore(baseGrantDate);
    }

    public int calculateMonthsWorked(LocalDate hiredAt, LocalDate today) {
        if (hiredAt == null || today == null)
            return 0;
        Period period = Period.between(hiredAt, today);
        return (int) period.toTotalMonths();
    }
}
