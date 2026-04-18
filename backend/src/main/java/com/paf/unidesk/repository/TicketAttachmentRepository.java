package com.paf.unidesk.repository;

import com.paf.unidesk.model.TicketAttachment;
import com.paf.unidesk.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {

    List<TicketAttachment> findByTicket(Ticket ticket);
    
    int countByTicket(Ticket ticket);
}