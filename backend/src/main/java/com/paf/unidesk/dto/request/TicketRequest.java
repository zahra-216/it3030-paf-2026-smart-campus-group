package com.paf.unidesk.dto.request;

import com.paf.unidesk.enums.TicketCategory;
import com.paf.unidesk.enums.TicketPriority;
import lombok.Data;

@Data
public class TicketRequest {

    private Long resourceId;
    private String location;
    private String title;
    private String description;
    private TicketCategory category;
    private TicketPriority priority;
    private String contactDetails;
    private String status;
    private String resolutionNotes;
}