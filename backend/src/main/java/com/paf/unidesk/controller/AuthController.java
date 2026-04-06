package com.paf.unidesk.controller;

import com.paf.unidesk.model.User;
import com.paf.unidesk.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}