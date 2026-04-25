package com.paf.unidesk.dto.response;

import java.time.LocalDateTime;

import com.paf.unidesk.enums.TicketCategory;
import com.paf.unidesk.enums.TicketPriority;
import com.paf.unidesk.enums.TicketStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TicketResponse {

    private Long id;
    private String title;
    private String description;
    private TicketCategory category;
    private TicketPriority priority;
    private TicketStatus status;
    private String location;
    private String contactDetails;

    private Long assignedToId;
    private String assignedToName;

    private Long submittedById;
    private String submittedByName;

    private Long resourceId;

    private String resolutionNotes;
    private String rejectionReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}