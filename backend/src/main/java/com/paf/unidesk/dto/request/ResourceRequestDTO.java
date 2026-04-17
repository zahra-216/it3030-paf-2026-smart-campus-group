package com.paf.unidesk.dto.request;

import com.paf.unidesk.enums.ResourceStatus;
import com.paf.unidesk.enums.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResourceRequestDTO {

    @NotBlank(message = "Resource name is required")
    private String name;

    @NotNull(message = "Resource type is required")
    private ResourceType type;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Status is required")
    private ResourceStatus status;

    @NotBlank(message = "Available from time is required")
    private String availableFrom;

    @NotBlank(message = "Available until time is required")
    private String availableUntil;
}