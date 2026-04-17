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

    // ✅ Create booking with full validation
    public Booking createBooking(Booking booking) {

        // 🔴 Null validations
        if (booking.getUser() == null || booking.getUser().getId() == null) {
            throw new RuntimeException("User is required");
        }

        if (booking.getResource() == null || booking.getResource().getId() == null) {
            throw new RuntimeException("Resource is required");
        }

        if (booking.getDate() == null) {
            throw new RuntimeException("Date is required");
        }

        if (booking.getStartTime() == null || booking.getEndTime() == null) {
            throw new RuntimeException("Start and End time are required");
        }

        // 🔴 Time validation
        if (booking.getEndTime().isBefore(booking.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }

        // 🔴 Prevent past booking (🔥 extra marks)
        if (booking.getDate().isBefore(java.time.LocalDate.now())) {
            throw new RuntimeException("Cannot book for past dates");
        }

        // 🔴 Conflict check
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

        // 🔴 Default status
        booking.setStatus(BookingStatus.PENDING);

        return bookingRepository.save(booking);
    }

    // ✅ Get all bookings
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // ✅ Get booking by ID
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    // ✅ Get bookings by status
    public List<Booking> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    // ✅ Approve booking
    public Booking approveBooking(Long id) {
        Booking booking = getBookingById(id);

        if (booking.getStatus() == BookingStatus.APPROVED) {
            throw new RuntimeException("Booking already approved");
        }

        booking.setStatus(BookingStatus.APPROVED);
        return bookingRepository.save(booking);
    }

    // ✅ Reject booking
    public Booking rejectBooking(Long id, String reason) {
        Booking booking = getBookingById(id);

        if (reason == null || reason.isEmpty()) {
            throw new RuntimeException("Rejection reason is required");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);

        return bookingRepository.save(booking);
    }

    // ✅ Delete booking
    public void deleteBooking(Long id) {
        Booking booking = getBookingById(id);
        bookingRepository.delete(booking);
    }
}