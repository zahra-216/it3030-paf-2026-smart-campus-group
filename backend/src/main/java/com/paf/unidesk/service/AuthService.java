package com.paf.unidesk.service;

import com.paf.unidesk.config.JwtUtil;
import com.paf.unidesk.exception.ResourceNotFoundException;
import com.paf.unidesk.model.User;
import com.paf.unidesk.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
}