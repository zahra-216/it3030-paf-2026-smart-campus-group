package com.paf.unidesk.controller;

import com.paf.unidesk.dto.request.ResourceRequestDTO;
import com.paf.unidesk.dto.response.ResourceResponseDTO;
import com.paf.unidesk.enums.ResourceStatus;
import com.paf.unidesk.enums.ResourceType;
import com.paf.unidesk.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    // POST /api/resources
    // Create a new resource (Admin only)
    @PostMapping
    public ResponseEntity<ResourceResponseDTO> createResource(
            @Valid @RequestBody ResourceRequestDTO requestDTO) {
        ResourceResponseDTO response = resourceService.createResource(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // GET /api/resources
    // Get all resources with optional filters (All users)
    @GetMapping
    public ResponseEntity<List<ResourceResponseDTO>> getAllResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location) {
        List<ResourceResponseDTO> resources = resourceService.getAllResources(type, status, minCapacity, location);
        return ResponseEntity.ok(resources);
    }

    // GET /api/resources/{id}
    // Get a single resource by ID (All users)
    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> getResourceById(@PathVariable Long id) {
        ResourceResponseDTO resource = resourceService.getResourceById(id);
        return ResponseEntity.ok(resource);
    }

    // PUT /api/resources/{id}
    // Update an existing resource (Admin only)
    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ResourceRequestDTO requestDTO) {
        ResourceResponseDTO updated = resourceService.updateResource(id, requestDTO);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/resources/{id}
    // Delete a resource (Admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}