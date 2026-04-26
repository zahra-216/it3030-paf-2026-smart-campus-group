package com.paf.unidesk.controller;

import com.paf.unidesk.model.Notification;
import com.paf.unidesk.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // Get all notifications for current user
    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        return ResponseEntity.ok(notificationService.getAllNotifications(token));
    }

    // Get unread notifications for current user
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        return ResponseEntity.ok(notificationService.getUnreadNotifications(token));
    }

    // Get unread notification count
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        long count = notificationService.getUnreadCount(token);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    // Mark single notification as read
    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        String token = authHeader.substring(7);
        return ResponseEntity.ok(notificationService.markAsRead(token, id));
    }

    // Mark all notifications as read
    @PutMapping("/read-all")
    public ResponseEntity<String> markAllAsRead(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        notificationService.markAllAsRead(token);
        return ResponseEntity.ok("All notifications marked as read");
    }

    // Delete a notification
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        String token = authHeader.substring(7);
        notificationService.deleteNotification(token, id);
        return ResponseEntity.noContent().build();
    }
}