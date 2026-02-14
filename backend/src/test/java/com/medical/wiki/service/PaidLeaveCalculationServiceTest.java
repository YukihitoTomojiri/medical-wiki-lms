package com.medical.wiki.service;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;

public class PaidLeaveCalculationServiceTest {

    private final PaidLeaveCalculationService service = new PaidLeaveCalculationService();

    @Test
    public void testCalculateGrantDays() {
        assertEquals(0.0, service.calculateGrantDays(0));
        assertEquals(0.0, service.calculateGrantDays(5));
        assertEquals(10.0, service.calculateGrantDays(6));
        assertEquals(10.0, service.calculateGrantDays(17));
        assertEquals(11.0, service.calculateGrantDays(18));
        assertEquals(12.0, service.calculateGrantDays(30));
        assertEquals(14.0, service.calculateGrantDays(42));
        assertEquals(16.0, service.calculateGrantDays(54));
        assertEquals(18.0, service.calculateGrantDays(66));
        assertEquals(20.0, service.calculateGrantDays(78));
        assertEquals(20.0, service.calculateGrantDays(100));
    }

    @Test
    public void testIsGrantDay() {
        LocalDate hiredAt = LocalDate.of(2023, 4, 1);

        // 0.5y: 2023-10-01
        assertTrue(service.isGrantDay(hiredAt, LocalDate.of(2023, 10, 1)));
        assertFalse(service.isGrantDay(hiredAt, LocalDate.of(2023, 10, 2)));

        // 1.5y: 2024-10-01
        assertTrue(service.isGrantDay(hiredAt, LocalDate.of(2024, 10, 1)));

        // 2.5y: 2025-10-01
        assertTrue(service.isGrantDay(hiredAt, LocalDate.of(2025, 10, 1)));
    }

    @Test
    public void testCalculateMonthsWorked() {
        LocalDate hiredAt = LocalDate.of(2023, 4, 1);
        assertEquals(6, service.calculateMonthsWorked(hiredAt, LocalDate.of(2023, 10, 1)));
        assertEquals(12, service.calculateMonthsWorked(hiredAt, LocalDate.of(2024, 4, 1)));
        assertEquals(18, service.calculateMonthsWorked(hiredAt, LocalDate.of(2024, 10, 1)));
    }
}
