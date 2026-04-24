package com.paf.unidesk.service;

import com.paf.unidesk.dto.request.TicketRequest;
import com.paf.unidesk.dto.response.TicketResponse;
import com.paf.unidesk.enums.TicketStatus;
import com.paf.unidesk.model.Resource;
import com.paf.unidesk.model.Ticket;
import com.paf.unidesk.model.TicketAttachment;
import com.paf.unidesk.model.User;
import com.paf.unidesk.repository.ResourceRepository;
import com.paf.unidesk.repository.TicketAttachmentRepository;
import com.paf.unidesk.repository.TicketRepository;
import com.paf.unidesk.repository.UserRepository;
import com.paf.unidesk.enums.Role;
import com.paf.unidesk.enums.TicketCategory;
import com.paf.unidesk.enums.TicketPriority;
import com.paf.unidesk.model.Comment;
import com.paf.unidesk.repository.CommentRepository;
import com.paf.unidesk.dto.request.CommentRequest;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.paf.unidesk.enums.NotificationType;

import java.io.File;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final CommentRepository commentRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final NotificationService notificationService;

    // ✅ CREATE TICKET
    public TicketResponse createTicket(TicketRequest request, Long userId) {

        // 🔹 get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 🔹 get resource
        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        // 🔹 create ticket
        Ticket ticket = Ticket.builder()
                .createdBy(user)
                .resource(resource)
                .location(request.getLocation())
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .priority(request.getPriority())
                .status(TicketStatus.OPEN) // default status
                .contactDetails(request.getContactDetails())
                .build();

        Ticket saved = ticketRepository.save(ticket);

        List<User> admins = userRepository.findAll().stream()
        .filter(u -> u.getRole() == Role.ADMIN)
        .toList();
        for (User admin : admins) {
            notificationService.createNotification(
                    admin,
                    "New ticket submitted: " + saved.getTitle(),
                    NotificationType.TICKET,
                    saved.getId()
            );
        }

        return mapToResponse(saved);
    }

    // ✅ GET MY TICKETS
    public List<TicketResponse> getMyTickets(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Ticket> tickets = ticketRepository.findByCreatedBy(user);

        return tickets.stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ✅ GET TICKET BY ID
    public TicketResponse getTicketById(Long ticketId) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        return mapToResponse(ticket);
    }

   private TicketResponse mapToResponse(Ticket ticket) {

    TicketResponse.TicketResponseBuilder builder = TicketResponse.builder()
            .id(ticket.getId())
            .title(ticket.getTitle())
            .description(ticket.getDescription())
            .category(ticket.getCategory())
            .priority(ticket.getPriority())
            .status(ticket.getStatus())
            .location(ticket.getLocation())
            .contactDetails(ticket.getContactDetails())

            .resolutionNotes(ticket.getResolutionNotes())
            .rejectionReason(ticket.getRejectionReason())

            .createdAt(ticket.getCreatedAt())
            .updatedAt(ticket.getUpdatedAt());

    // Submitted by
    if (ticket.getCreatedBy() != null) {
        builder.submittedById(ticket.getCreatedBy().getId())
               .submittedByName(ticket.getCreatedBy().getName());
    }

    // Assigned to
    if (ticket.getAssignedTo() != null) {
        builder.assignedToId(ticket.getAssignedTo().getId())
               .assignedToName(ticket.getAssignedTo().getName());
    }

    // Resource
    if (ticket.getResource() != null) {
        builder.resourceId(ticket.getResource().getId());
    }

    return builder.build();
}
    // ✅ UPDATE TICKET
    public TicketResponse updateTicket(Long id, TicketRequest request) {

    Ticket ticket = ticketRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    ticket.setTitle(request.getTitle());
    ticket.setDescription(request.getDescription());
    ticket.setPriority(request.getPriority());
    ticket.setCategory(request.getCategory());
    ticket.setLocation(request.getLocation());
    ticket.setContactDetails(request.getContactDetails());

    ticketRepository.save(ticket);

    return mapToResponse(ticket);
    }

    // ✅ DELETE TICKET
    public void deleteTicket(Long id) {

    Ticket ticket = ticketRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    ticketRepository.delete(ticket);
}

// UPDATE STATUS
public TicketResponse updateStatus(Long id, String status) {

    Ticket ticket = ticketRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    TicketStatus newStatus = TicketStatus.valueOf(status);

    // Workflow validation
    if (ticket.getStatus() == TicketStatus.OPEN && newStatus == TicketStatus.IN_PROGRESS) {
        ticket.setStatus(newStatus);
    } else if (ticket.getStatus() == TicketStatus.IN_PROGRESS && newStatus == TicketStatus.RESOLVED) {
        ticket.setStatus(newStatus);
    } else if (ticket.getStatus() == TicketStatus.RESOLVED && newStatus == TicketStatus.CLOSED) {
        ticket.setStatus(newStatus);
    } else if (newStatus == TicketStatus.REJECTED) {
        ticket.setStatus(newStatus);
    } else {
        throw new RuntimeException("Invalid status transition");
    }

    ticketRepository.save(ticket);

    return mapToResponse(ticket);
}


// ASSIGN TICKET
public TicketResponse assignTicket(Long ticketId, Long userId, Long adminId) {

    // 🔹 check admin
    User admin = userRepository.findById(adminId)
            .orElseThrow(() -> new RuntimeException("Admin not found"));

    if (admin.getRole() != Role.ADMIN) {
        throw new RuntimeException("Only ADMIN can assign technicians");
    }

    // 🔹 get ticket
    Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    // 🔹 get technician/user
    User technician = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

    // 🔥 IMPORTANT: only allow TECHNICIAN
    if (technician.getRole() != Role.TECHNICIAN) {
        throw new RuntimeException("You can only assign TECHNICIANS");
    }

    if (ticket.getAssignedTo() != null) {
        throw new RuntimeException("Ticket already assigned");
    }

    if (ticket.getStatus() == TicketStatus.CLOSED ||
        ticket.getStatus() == TicketStatus.REJECTED) {
        throw new RuntimeException("Cannot assign this ticket");
    }

    // 🔹 assign
    ticket.setAssignedTo(technician);

    ticketRepository.save(ticket);

    notificationService.createNotification(
        technician,
        "You have been assigned to ticket: " + ticket.getTitle(),
        NotificationType.TICKET,
        ticket.getId()
    );

    return mapToResponse(ticket);
}

// GET TICKETS ASSIGNED TO ME (TECHNICIAN)
public List<TicketResponse> getMyAssignedTickets(Long technicianId) {

    User technician = userRepository.findById(technicianId)
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (technician.getRole() != Role.TECHNICIAN) {
        throw new RuntimeException("Only technicians can use this");
    }

    List<Ticket> tickets = ticketRepository.findByAssignedTo(technician);

    return tickets.stream()
            .map(this::mapToResponse)
            .toList();
}


// GET ALL TICKETS ASSIGNED TO A TECHNICIAN (ADMIN)
public List<TicketResponse> getAssignedTickets(Long technicianId) {

    User technician = userRepository.findById(technicianId)
            .orElseThrow(() -> new RuntimeException("Technician not found"));

    List<Ticket> tickets = ticketRepository.findByAssignedTo(technician);

    return tickets.stream()
            .map(this::mapToResponse)
            .toList();
}

// TECHNICIAN UPDATES TICKET (RESOLUTION NOTES + STATUS)
public TicketResponse technicianUpdateTicket(
        Long ticketId,
        Long technicianId,
        TicketRequest request) {

    Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    User technician = userRepository.findById(technicianId)
            .orElseThrow(() -> new RuntimeException("Technician not found"));

    if (technician.getRole() != Role.TECHNICIAN) {
        throw new RuntimeException("Only technicians allowed");
    }

    if (ticket.getAssignedTo() == null ||
        !ticket.getAssignedTo().getId().equals(technicianId)) {
        throw new RuntimeException("Ticket not assigned to this technician");
    }

    TicketStatus newStatus = TicketStatus.valueOf(request.getStatus());

    if (ticket.getStatus() == TicketStatus.OPEN &&
        newStatus == TicketStatus.IN_PROGRESS) {

        ticket.setStatus(newStatus);

    } else if (ticket.getStatus() == TicketStatus.IN_PROGRESS &&
               newStatus == TicketStatus.RESOLVED) {

        ticket.setStatus(newStatus);

        List<User> admins = userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.ADMIN)
            .toList();
        for (User admin : admins) {
            notificationService.createNotification(
                    admin,
                    "Ticket resolved: " + ticket.getTitle() + ". Please review and close.",
                    NotificationType.TICKET,
                    ticket.getId()
            );
        }
        notificationService.createNotification(
                ticket.getCreatedBy(),
                "Your ticket '" + ticket.getTitle() + "' has been resolved.",
                NotificationType.TICKET,
                ticket.getId()
        );

    } else {
        throw new RuntimeException("Invalid technician status update");
    }

    ticket.setResolutionNotes(request.getResolutionNotes());

    ticketRepository.save(ticket);

    return mapToResponse(ticket);
}

// ADD COMMENT TO TICKET
public Comment addComment(
        Long ticketId,
        Long userId,
        CommentRequest request) {

    Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));


    Comment comment = Comment.builder()
            .ticket(ticket)
            .user(user)
            .content(request.getContent())
            .build();
               

    return commentRepository.save(comment);
}

// GET COMMENTS FOR TICKET
public List<Comment> getComments(Long ticketId) {

    Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    return commentRepository.findByTicketOrderByCreatedAtAsc(ticket);
}

// UPDATE COMMENT
public Comment updateComment(Long commentId, Long userId, CommentRequest request) {

    Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));

    // only owner can edit
    if (!comment.getUser().getId().equals(userId)) {
        throw new RuntimeException("You can only edit your own comments");
    }

    comment.setContent(request.getContent());

    return commentRepository.save(comment);
}

// DELETE COMMENT
public void deleteComment(Long commentId, Long userId) {

    Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));

    boolean isOwner = comment.getUser().getId().equals(userId);
    boolean isAdmin = comment.getUser().getRole().equals(Role.ADMIN);

    if (!isOwner && !isAdmin) {
        throw new RuntimeException("Not allowed to delete comment");
    }

    commentRepository.delete(comment);
}

// UPLOAD ATTACHMENT
public String uploadAttachment(Long ticketId, MultipartFile file) throws Exception {

    Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    // STEP 1: CHECK MAX LIMIT (3 attachments per ticket)
    int existingCount = ticketAttachmentRepository.countByTicket(ticket);

    if (existingCount >= 3) {
        throw new RuntimeException("Maximum 3 attachments allowed per ticket");
    }

    // STEP 2: CREATE UPLOAD DIRECTORY
    String uploadDir = System.getProperty("user.dir") + File.separator + "uploads" + File.separator;

    File dir = new File(uploadDir);
    if (!dir.exists()) {
        dir.mkdirs();
    }

    // STEP 3: SAVE FILE
    String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
    String filePath = uploadDir + fileName;

    file.transferTo(new File(filePath));

    // STEP 4: SAVE DB RECORD
    TicketAttachment attachment = TicketAttachment.builder()
            .ticket(ticket)
            .fileUrl(fileName)
            .build();

    ticketAttachmentRepository.save(attachment);

    return "Attachment uploaded successfully";
}

// GET ATTACHMENTS FOR TICKET
public List<TicketAttachment> getAttachments(Long ticketId) {

    Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    return ticketAttachmentRepository.findByTicket(ticket);
}

// DELETE ATTACHMENT
public void deleteAttachment(Long attachmentId) {

    TicketAttachment attachment = ticketAttachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new RuntimeException("Attachment not found"));

    // delete physical file
    File file = new File("uploads/" + attachment.getFileUrl());
    if (file.exists()) {
        file.delete();
    }

    ticketAttachmentRepository.delete(attachment);
}

// FILTER TICKETS (ADMIN)
public List<TicketResponse> filterTickets(
        TicketStatus status,
        TicketPriority priority,
        TicketCategory category) {

    List<Ticket> tickets;

    if (status != null && priority != null && category != null) {
        tickets = ticketRepository.findByStatusAndPriorityAndCategory(status, priority, category);

    } else if (status != null && priority != null) {
        tickets = ticketRepository.findByStatusAndPriority(status, priority);

    } else if (status != null && category != null) {
        tickets = ticketRepository.findByStatusAndCategory(status, category);

    } else if (priority != null && category != null) {
        tickets = ticketRepository.findByPriorityAndCategory(priority, category);

    } else if (status != null) {
        tickets = ticketRepository.findByStatus(status);

    } else if (priority != null) {
        tickets = ticketRepository.findByPriority(priority);

    } else if (category != null) {
        tickets = ticketRepository.findByCategory(category);

    } else {
        tickets = ticketRepository.findAll();
    }

    return tickets.stream()
            .map(this::mapToResponse)
            .toList();
}

// ADMIN REJECT TICKET
public TicketResponse rejectTicket(Long ticketId, Long adminId, TicketRequest request) {

    Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    User admin = userRepository.findById(adminId)
            .orElseThrow(() -> new RuntimeException("Admin not found"));

    // ONLY ADMIN CAN REJECT
    if (admin.getRole() != Role.ADMIN) {
        throw new RuntimeException("Only ADMIN can reject tickets");
    }

    //  prevent invalid states
    if (ticket.getStatus() == TicketStatus.CLOSED ||
        ticket.getStatus() == TicketStatus.RESOLVED) {
        throw new RuntimeException("Cannot reject this ticket");
    }

    //  MUST HAVE REASON
    if (request.getRejectionReason() == null ||
        request.getRejectionReason().trim().isEmpty()) {
        throw new RuntimeException("Rejection reason is required");
    }

    //  update ticket
    ticket.setStatus(TicketStatus.REJECTED);
    ticket.setRejectionReason(request.getRejectionReason());

    ticketRepository.save(ticket);

    notificationService.createNotification(
        ticket.getCreatedBy(),
        "Your ticket '" + ticket.getTitle() + "' has been rejected. Reason: " + request.getRejectionReason(),
        NotificationType.TICKET,
        ticket.getId()
    );

    return mapToResponse(ticket);
}
}