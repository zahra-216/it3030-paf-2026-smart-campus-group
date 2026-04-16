package com.paf.unidesk.repository;

import com.paf.unidesk.model.Resource;
import com.paf.unidesk.enums.ResourceType;
import com.paf.unidesk.enums.ResourceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findByType(ResourceType type);

    List<Resource> findByStatus(ResourceStatus status);

    List<Resource> findByTypeAndStatus(ResourceType type, ResourceStatus status);

    List<Resource> findByCapacityGreaterThanEqual(Integer capacity);

    List<Resource> findByLocationContainingIgnoreCase(String location);
}