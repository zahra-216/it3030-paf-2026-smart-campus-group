package com.paf.unidesk.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.paf.unidesk.dto.request.UpdateProfileRequest;
import com.paf.unidesk.model.User;
import com.paf.unidesk.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    // Get current logged in user profile
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        User user = authService.getCurrentUser(token);
        return ResponseEntity.ok(user);
    }

    // Logout endpoint
    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        return ResponseEntity.ok("Logged out successfully");
    }

    // Get all users - Admin only
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = authService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // Update user role - Admin only
    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id,
                                                @RequestParam String role) {
        User updatedUser = authService.updateUserRole(id, role);
        return ResponseEntity.ok(updatedUser);
    }

    // Complete user profile - first time login
    @PutMapping("/me/profile")
    public ResponseEntity<User> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateProfileRequest request) {
        String token = authHeader.substring(7);
        User updatedUser = authService.updateProfile(token, request);
        return ResponseEntity.ok(updatedUser);
    }
}