package com.paf.unidesk.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.paf.unidesk.model.Booking;
import com.paf.unidesk.model.Resource;
import com.paf.unidesk.enums.BookingStatus;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Get bookings for a resource on a specific date
    List<Booking> findByResourceAndDate(Resource resource, LocalDate date);

    // Conflict checking (VERY IMPORTANT)
    List<Booking> findByResourceAndDateAndStartTimeLessThanAndEndTimeGreaterThan(
            Resource resource,
            LocalDate date,
            LocalTime endTime,
            LocalTime startTime
    );

    // Get bookings by status
    List<Booking> findByStatus(BookingStatus status);
}