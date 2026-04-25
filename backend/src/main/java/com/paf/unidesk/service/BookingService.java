package com.paf.unidesk.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.paf.unidesk.enums.BookingStatus;
import com.paf.unidesk.enums.NotificationType;
import com.paf.unidesk.enums.Role;
import com.paf.unidesk.model.Booking;
import com.paf.unidesk.model.User;
import com.paf.unidesk.repository.BookingRepository;
import com.paf.unidesk.repository.UserRepository;

@Service
public class BookingService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationService notificationService;

    // ✅ Create booking with validation + smart conflict message
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

        // 🔴 Prevent past booking
        if (booking.getDate().isBefore(java.time.LocalDate.now())) {
            throw new RuntimeException("Cannot book for past dates");
        }

        // 🔴 Conflict check (UPDATED 🔥)
        List<Booking> conflicts = bookingRepository
                .findByResourceAndDateAndStartTimeLessThanAndEndTimeGreaterThan(
                        booking.getResource(),
                        booking.getDate(),
                        booking.getEndTime(),
                        booking.getStartTime()
                );

        if (!conflicts.isEmpty()) {
            Booking conflict = conflicts.get(0);

            throw new RuntimeException(
                    "Resource is INACTIVE from " +
                            conflict.getStartTime() + " to " +
                            conflict.getEndTime() +
                            ". It becomes ACTIVE after that time."
            );
        }

        // 🔴 Default status
        booking.setStatus(BookingStatus.PENDING);

        Booking saved = bookingRepository.save(booking);

        // Fetch full booking with user and resource populated
        Booking fullBooking = bookingRepository.findById(saved.getId())
                .orElse(saved);

        // Notify all admins about new booking
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .toList();
        for (User admin : admins) {
            notificationService.createNotification(
                    admin,
                    "New booking request from " + fullBooking.getUser().getName() + " for " + fullBooking.getResource().getName(),
                    NotificationType.BOOKING,
                    saved.getId()
            );
        }
        return saved;
    }

    // ✅ NEW METHOD (🔥 MAIN FEATURE)
    public String getResourceStatusForTime(Booking booking) {

        List<Booking> conflicts = bookingRepository
                .findByResourceAndDateAndStartTimeLessThanAndEndTimeGreaterThan(
                        booking.getResource(),
                        booking.getDate(),
                        booking.getEndTime(),
                        booking.getStartTime()
                );

        if (!conflicts.isEmpty()) {
            Booking conflict = conflicts.get(0);

            return "INACTIVE from " +
                    conflict.getStartTime() + " to " +
                    conflict.getEndTime() +
                    ", ACTIVE after that";
        }

        return "ACTIVE";
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
        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
            booking.getUser(),
            "Your booking for " + booking.getResource().getName() + " on " + booking.getDate() + " has been approved.",
            NotificationType.BOOKING,
            booking.getId()
        );

        return saved;
        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
            booking.getUser(),
            "Your booking for " + booking.getResource().getName() + " on " + booking.getDate() + " has been approved.",
            NotificationType.BOOKING,
            booking.getId()
        );

        return saved;
    }

    // ✅ Reject booking
    public Booking rejectBooking(Long id, String reason) {
        Booking booking = getBookingById(id);

        if (reason == null || reason.isEmpty()) {
            throw new RuntimeException("Rejection reason is required");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);

        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
            booking.getUser(),
            "Your booking for " + booking.getResource().getName() + " has been rejected. Reason: " + reason,
            NotificationType.BOOKING,
            booking.getId()
        );

        return saved;
    }

    // ✅ Cancel booking
    public Booking cancelBooking(Long id, String reason) {
        Booking booking = getBookingById(id);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking already cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);

        // Set reason if provided
        if (reason != null && !reason.trim().isEmpty()) {
            booking.setRejectionReason(reason); // reuse rejectionReason field
        }

        Booking saved = bookingRepository.save(booking);

        notificationService.createNotification(
            booking.getUser(),
            "Your booking for " + booking.getResource().getName() + " on " + booking.getDate() + " has been cancelled.",
            NotificationType.BOOKING,
            saved.getId()
        );
        return saved;
    }

    // ✅ Delete booking
    public void deleteBooking(Long id) {
        Booking booking = getBookingById(id);
        bookingRepository.delete(booking);
    }
}