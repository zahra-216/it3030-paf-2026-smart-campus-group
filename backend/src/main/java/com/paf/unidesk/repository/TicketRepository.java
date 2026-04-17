package com.paf.unidesk.repository;

import com.paf.unidesk.model.Ticket;
import com.paf.unidesk.model.User;
import com.paf.unidesk.enums.TicketStatus;
import com.paf.unidesk.enums.TicketPriority;
import com.paf.unidesk.enums.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Get tickets created by a user
    List<Ticket> findByCreatedBy(User user);

    // Get tickets assigned to a technician
    List<Ticket> findByAssignedTo(User user);

    // Filter by status
    List<Ticket> findByStatus(TicketStatus status);
    
    List<Ticket> findByPriority(TicketPriority priority);

    List<Ticket> findByCategory(TicketCategory category);

    List<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority);

    List<Ticket> findByStatusAndCategory(TicketStatus status, TicketCategory category);

    List<Ticket> findByPriorityAndCategory(TicketPriority priority, TicketCategory category);

    List<Ticket> findByStatusAndPriorityAndCategory(
        TicketStatus status,
        TicketPriority priority,
        TicketCategory category
);
}