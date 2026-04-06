package com.paf.unidesk.service;

import com.paf.unidesk.config.JwtUtil;
import com.paf.unidesk.exception.ResourceNotFoundException;
import com.paf.unidesk.model.User;
import com.paf.unidesk.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.paf.unidesk.enums.Role;
import java.util.List;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    public User getCurrentUser(String token) {
        String email = jwtUtil.extractEmail(token);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public List<User> getAllUsers() {
    return userRepository.findAll();
    }

    public User updateUserRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setRole(Role.valueOf(role));
        return userRepository.save(user);
    }
}