package com.paf.unidesk.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.paf.unidesk.enums.BookingStatus;
import com.paf.unidesk.model.Booking;
import com.paf.unidesk.service.BookingService;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // ✅ Create booking
    @PostMapping
    public Booking createBooking(@RequestBody Booking booking) {
        return bookingService.createBooking(booking);
    }

    // ✅ NEW: Check availability before booking (🔥)
    @PostMapping("/check")
    public String checkAvailability(@RequestBody Booking booking) {
        return bookingService.getResourceStatusForTime(booking);
    }

    // ✅ Get all bookings
    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    // ✅ Get booking by ID
    @GetMapping("/{id}")
    public Booking getBookingById(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    // ✅ Get bookings by status
    @GetMapping("/status/{status}")
    public List<Booking> getBookingsByStatus(@PathVariable BookingStatus status) {
        return bookingService.getBookingsByStatus(status);
    }

    // ✅ Approve booking
    @PutMapping("/{id}/approve")
    public Booking approveBooking(@PathVariable Long id) {
        return bookingService.approveBooking(id);
    }

    // ✅ Reject booking
    @PutMapping("/{id}/reject")
    public Booking rejectBooking(
            @PathVariable Long id,
            @RequestParam String reason
    ) {
        return bookingService.rejectBooking(id, reason);
    }

    // ✅ Cancel booking
    @PutMapping("/{id}/cancel")
    public Booking cancelBooking(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return bookingService.cancelBooking(id, reason);
    }

    // ✅ Delete booking
    @DeleteMapping("/{id}")
    public String deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return "Booking deleted successfully";
    }
}