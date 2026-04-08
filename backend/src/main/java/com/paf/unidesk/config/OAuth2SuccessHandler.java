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
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
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

        OAuth2AuthenticationToken authToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = authToken.getPrincipal();
        String provider = authToken.getAuthorizedClientRegistrationId(); // "google" or "github"

        String email = null;
        String name = null;
        String picture = null;
        String oauthId = null;
        OAuthProvider oAuthProvider = null;

        if (provider.equals("google")) {
            email = oAuth2User.getAttribute("email");
            name = oAuth2User.getAttribute("name");
            picture = oAuth2User.getAttribute("picture");
            oauthId = oAuth2User.getAttribute("sub");
            oAuthProvider = OAuthProvider.GOOGLE;

        } else if (provider.equals("github")) {
            email = oAuth2User.getAttribute("email");
            name = oAuth2User.getAttribute("login");
            picture = oAuth2User.getAttribute("avatar_url");
            Object idObj = oAuth2User.getAttribute("id");
            oauthId = idObj != null ? idObj.toString() : null;
            oAuthProvider = OAuthProvider.GITHUB;
        }

        // Check if user already exists
        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            user = User.builder()
                    .email(email)
                    .name(name)
                    .profilePicture(picture)
                    .oauthId(oauthId)
                    .oauthProvider(oAuthProvider)
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