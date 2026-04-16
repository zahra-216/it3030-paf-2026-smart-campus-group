package com.paf.unidesk.controller;

import com.paf.unidesk.dto.request.TicketRequest;
import com.paf.unidesk.dto.response.TicketResponse;
import com.paf.unidesk.service.TicketService;
import com.paf.unidesk.model.Comment;
import com.paf.unidesk.dto.request.CommentRequest;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    // ✅ CREATE
    @PostMapping
    public TicketResponse createTicket(
            @RequestBody TicketRequest request,
            @RequestParam Long userId
    ) {
        return ticketService.createTicket(request, userId);
    }

    // ✅ GET MY TICKETS
    @GetMapping("/my")
    public List<TicketResponse> getMyTickets(@RequestParam Long userId) {
        return ticketService.getMyTickets(userId);
    }

    // ✅ GET BY ID
    @GetMapping("/{id}")
    public TicketResponse getTicketById(@PathVariable Long id) {
        return ticketService.getTicketById(id);
    }

    @PutMapping("/{id}")
    public TicketResponse updateTicket(@PathVariable Long id,
                                   @RequestBody TicketRequest request) {
    return ticketService.updateTicket(id, request);
    }

    @DeleteMapping("/{id}")
    public String deleteTicket(@PathVariable Long id) {
    ticketService.deleteTicket(id);
    return "Deleted successfully";
    }

    // UPDATE STATUS
    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
        @PathVariable Long id,
        @RequestParam String status) {

    return ResponseEntity.ok(ticketService.updateStatus(id, status));
    }

    // ASSIGN TICKET
    @PutMapping("/{ticketId}/assign/{technicianId}/{adminId}")
public ResponseEntity<TicketResponse> assignTicket(
        @PathVariable Long ticketId,
        @PathVariable Long technicianId,
        @PathVariable Long adminId) {

    return ResponseEntity.ok(
            ticketService.assignTicket(ticketId, technicianId, adminId)
    );
}

// GET TICKETS ASSIGNED TO EacH TECHNICIAN       
@GetMapping("/my-assigned/{technicianId}")
public ResponseEntity<List<TicketResponse>> getMyAssignedTickets(
        @PathVariable Long technicianId) {

    return ResponseEntity.ok(
            ticketService.getMyAssignedTickets(technicianId)
    );
}

// GET ALL TICKETS (FOR ADMIN)
@GetMapping("/assigned/{technicianId}")
public ResponseEntity<List<TicketResponse>> getAssignedTickets(
        @PathVariable Long technicianId) {

    return ResponseEntity.ok(
            ticketService.getAssignedTickets(technicianId)
    );
}

// TECHNICIAN UPDATES TICKET (RESOLUTION NOTES + STATUS)
@PutMapping("/{ticketId}/technician-update/{technicianId}")
public ResponseEntity<TicketResponse> technicianUpdateTicket(
        @PathVariable Long ticketId,
        @PathVariable Long technicianId,
        @RequestBody TicketRequest request) {

    return ResponseEntity.ok(
            ticketService.technicianUpdateTicket(
                    ticketId,
                    technicianId,
                    request
            )
    );
}

// ADD COMMENT TO TICKET
@PostMapping("/{ticketId}/comments/{userId}")
public ResponseEntity<Comment> addComment(
        @PathVariable Long ticketId,
        @PathVariable Long userId,
        @RequestBody CommentRequest request) {

    return ResponseEntity.ok(
            ticketService.addComment(ticketId, userId, request)
    );
}

// GET COMMENTS FOR TICKET
@GetMapping("/{ticketId}/comments")
public ResponseEntity<List<Comment>> getComments(
        @PathVariable Long ticketId) {

    return ResponseEntity.ok(
            ticketService.getComments(ticketId)
    );
}
}