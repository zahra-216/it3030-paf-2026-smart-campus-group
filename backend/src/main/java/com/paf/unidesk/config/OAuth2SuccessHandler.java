package com.paf.unidesk.config;

import com.paf.unidesk.enums.OAuthProvider;
import com.paf.unidesk.enums.Role;
import com.paf.unidesk.model.User;
import com.paf.unidesk.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String oauthId = oAuth2User.getAttribute("sub");

        // Check if user already exists
        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        if (existingUser.isPresent()) {
            // Existing user - just load them
            user = existingUser.get();
        } else {
            // New user - create account
            user = User.builder()
                    .email(email)
                    .name(name)
                    .profilePicture(picture)
                    .oauthId(oauthId)
                    .oauthProvider(OAuthProvider.GOOGLE)
                    .role(Role.USER)
                    .isProfileComplete(false)
                    .build();
            userRepository.save(user);
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        // Redirect to frontend with token
        String redirectUrl = "http://localhost:5173/oauth2/callback?token=" + token;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}