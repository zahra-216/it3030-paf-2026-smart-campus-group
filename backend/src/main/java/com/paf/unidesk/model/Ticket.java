package com.paf.unidesk.model;

import com.paf.unidesk.enums.TicketCategory;
import com.paf.unidesk.enums.TicketPriority;
import com.paf.unidesk.enums.TicketStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Ticket extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;

    private String location;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status;

    @ManyToOne
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    private String rejectionReason;

    private String contactDetails;
}