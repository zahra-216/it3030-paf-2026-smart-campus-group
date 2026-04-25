package com.paf.unidesk.service;

import com.paf.unidesk.enums.NotificationType;
import com.paf.unidesk.exception.ResourceNotFoundException;
import com.paf.unidesk.exception.UnauthorizedException;
import com.paf.unidesk.model.Notification;
import com.paf.unidesk.model.User;
import com.paf.unidesk.repository.NotificationRepository;
import com.paf.unidesk.repository.UserRepository;
import com.paf.unidesk.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // Get current user from token
    private User getUserFromToken(String token) {
        String email = jwtUtil.extractEmail(token);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // Create a notification - called internally by other services
    public void createNotification(User user, String message, NotificationType type, Long referenceId) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .isRead(false)
                .referenceId(referenceId)
                .build();
        notificationRepository.save(notification);
    }

    // Get all notifications for current user
    public List<Notification> getAllNotifications(String token) {
        User user = getUserFromToken(token);
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // Get unread notifications for current user
    public List<Notification> getUnreadNotifications(String token) {
        User user = getUserFromToken(token);
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
    }

    // Get unread notification count
    public long getUnreadCount(String token) {
        User user = getUserFromToken(token);
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    // Mark single notification as read
    public Notification markAsRead(String token, Long notificationId) {
        User user = getUserFromToken(token);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        // Make sure the notification belongs to the current user
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You are not allowed to access this notification");
        }

        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    // Mark all notifications as read
    public void markAllAsRead(String token) {
        User user = getUserFromToken(token);
        List<Notification> unreadNotifications = notificationRepository
                .findByUserAndIsReadFalseOrderByCreatedAtDesc(user);

        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    // Delete a notification
    public void deleteNotification(String token, Long notificationId) {
        User user = getUserFromToken(token);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You cannot delete this notification");
        }
        notificationRepository.delete(notification);
    }
}