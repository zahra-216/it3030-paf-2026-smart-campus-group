package com.paf.unidesk.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.paf.unidesk.enums.BookingStatus;
import com.paf.unidesk.model.Booking;
import com.paf.unidesk.repository.BookingRepository;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    // ✅ Create booking with conflict check
    public Booking createBooking(Booking booking) {

        // 🔴 Check time validity
        if (booking.getEndTime().isBefore(booking.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }

        // 🔴 Check conflicts
        List<Booking> conflicts = bookingRepository
                .findByResourceAndDateAndStartTimeLessThanAndEndTimeGreaterThan(
                        booking.getResource(),
                        booking.getDate(),
                        booking.getEndTime(),
                        booking.getStartTime()
                );

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Booking conflict! Time slot already taken.");
        }

        // Set default status
        booking.setStatus(BookingStatus.PENDING);

        return bookingRepository.save(booking);
    }

    // ✅ Get all bookings
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // ✅ Get bookings by status
    public List<Booking> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    // ✅ Approve booking
    public Booking approveBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(BookingStatus.APPROVED);
        return bookingRepository.save(booking);
    }

    // ✅ Reject booking
    public Booking rejectBooking(Long id, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);

        return bookingRepository.save(booking);
    }
}