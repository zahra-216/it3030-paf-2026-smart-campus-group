package com.paf.unidesk.service;

import com.paf.unidesk.dto.request.ResourceRequestDTO;
import com.paf.unidesk.dto.response.ResourceResponseDTO;
import com.paf.unidesk.enums.ResourceStatus;
import com.paf.unidesk.enums.ResourceType;
import com.paf.unidesk.model.Resource;
import com.paf.unidesk.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
 
import java.util.List;
import java.util.stream.Collectors;
 
@Service
@RequiredArgsConstructor
public class ResourceService {
 
    private final ResourceRepository resourceRepository;
 
    //Creates a new resource using the provided request data.
    public ResourceResponseDTO createResource(ResourceRequestDTO requestDTO) {
        Resource resource = Resource.builder()
                .name(requestDTO.getName())
                .type(requestDTO.getType())
                .capacity(requestDTO.getCapacity())
                .location(requestDTO.getLocation())
                .status(requestDTO.getStatus())
                .availableFrom(requestDTO.getAvailableFrom())
                .availableUntil(requestDTO.getAvailableUntil())
                .build();
 
        Resource saved = resourceRepository.save(resource);
        return mapToResponseDTO(saved);
    }
 
    //Retrieves resources based on optional filtering criteria.
    public List<ResourceResponseDTO> getAllResources(ResourceType type, ResourceStatus status,
                                                     Integer minCapacity, String location) {
        
        
        List<Resource> resources = resourceRepository.findAll();

        if (type != null) {
            resources = resources.stream()
            .filter(r -> r.getType() == type)
            .collect(Collectors.toList());
        }

        if (status != null) {
            resources = resources.stream()
            .filter(r -> r.getStatus() == status)
            .collect(Collectors.toList());
        }

        if (location != null && !location.isEmpty()) {
            resources = resources.stream()
            .filter(r -> r.getLocation().toLowerCase().contains(location.toLowerCase()))
            .collect(Collectors.toList());
        }

        if (minCapacity != null) {
            resources = resources.stream()
            .filter(r -> r.getCapacity() >= minCapacity)
            .collect(Collectors.toList());
        }
 
        return resources.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }
 
    //Retrieves a resource by its ID.
    public ResourceResponseDTO getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
        return mapToResponseDTO(resource);
    }
 
    //Updates an existing resource with new data.
    public ResourceResponseDTO updateResource(Long id, ResourceRequestDTO requestDTO) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
 
        resource.setName(requestDTO.getName());
        resource.setType(requestDTO.getType());
        resource.setCapacity(requestDTO.getCapacity());
        resource.setLocation(requestDTO.getLocation());
        resource.setStatus(requestDTO.getStatus());
        resource.setAvailableFrom(requestDTO.getAvailableFrom());
        resource.setAvailableUntil(requestDTO.getAvailableUntil());
 
        Resource updated = resourceRepository.save(resource);
        return mapToResponseDTO(updated);
    }
 
    //Deletes a resource by its ID.
    public void deleteResource(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
        resourceRepository.delete(resource);
    }
 
    // ── Helper ───────────────────────────────────────────────────────
    private ResourceResponseDTO mapToResponseDTO(Resource resource) {
        ResourceResponseDTO dto = new ResourceResponseDTO();
        dto.setId(resource.getId());
        dto.setName(resource.getName());
        dto.setType(resource.getType());
        dto.setCapacity(resource.getCapacity());
        dto.setLocation(resource.getLocation());
        dto.setStatus(resource.getStatus());
        dto.setAvailableFrom(resource.getAvailableFrom());
        dto.setAvailableUntil(resource.getAvailableUntil());
        dto.setCreatedAt(resource.getCreatedAt());
        dto.setUpdatedAt(resource.getUpdatedAt());
        return dto;
    }
}
 