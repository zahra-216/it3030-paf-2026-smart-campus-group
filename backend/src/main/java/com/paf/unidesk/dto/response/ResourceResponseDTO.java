package com.paf.unidesk.dto.response;

import com.paf.unidesk.enums.ResourceStatus;
import com.paf.unidesk.enums.ResourceType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ResourceResponseDTO {

    private Long id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private ResourceStatus status;
    private String availableFrom;
    private String availableUntil;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}