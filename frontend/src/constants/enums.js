export const ResourceType = {
    LAB: "LAB",
    LECTURE_HALL: "LECTURE_HALL",
    MEETING_ROOM: "MEETING_ROOM",
    EQUIPMENT: "EQUIPMENT",
};

export const ResourceStatus = {
    ACTIVE: "ACTIVE",
    OUT_OF_SERVICE: "OUT_OF_SERVICE",
};

export const BookingStatus = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED",
};

export const TicketStatus = {
    OPEN: "OPEN",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
    REJECTED: "REJECTED",
};

export const TicketPriority = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
};

export const TicketCategory = {
    ELECTRICAL: "ELECTRICAL",
    PLUMBING: "PLUMBING",
    EQUIPMENT: "EQUIPMENT",
    FURNITURE: "FURNITURE",
    OTHER: "OTHER",
};

export const NotificationType = {
    BOOKING: "BOOKING",
    TICKET: "TICKET",
    COMMENT: "COMMENT",
};

export const Role = {
    USER: "USER",
    TECHNICIAN: "TECHNICIAN",
    ADMIN: "ADMIN",
};

export const OAuthProvider = {
    GOOGLE: "GOOGLE",
    GITHUB: "GITHUB",
};