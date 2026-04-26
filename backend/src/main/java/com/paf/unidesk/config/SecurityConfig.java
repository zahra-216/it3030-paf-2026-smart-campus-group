package com.paf.unidesk.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Autowired
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:5173",
            "https://uni-desk.vercel.app",
            "https://*.vercel.app"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Authorization"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/oauth2/**").permitAll()
                .requestMatchers("/login/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()

                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers("/api/auth/logout").authenticated()
                .requestMatchers("/api/auth/users").hasRole("ADMIN")
                .requestMatchers("/api/auth/users/**").hasRole("ADMIN")

                .requestMatchers("/api/notifications/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/notifications/**").authenticated()

                .requestMatchers(HttpMethod.GET, "/api/resources").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/resources/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/resources").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/resources/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/resources/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/bookings").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/bookings/check").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/bookings").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/bookings/{id}").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/bookings/status/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/bookings/*/approve").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/bookings/*/reject").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/bookings/*/cancel").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/bookings/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/api/tickets").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/tickets/my").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/tickets/filter").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/tickets/my-assigned/**").hasAnyRole("ADMIN", "TECHNICIAN")
                .requestMatchers(HttpMethod.GET, "/api/tickets/assigned/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/tickets/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/tickets/*/status").hasAnyRole("ADMIN", "TECHNICIAN")
                .requestMatchers(HttpMethod.PUT, "/api/tickets/*/assign/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/tickets/*/technician-update/**").hasRole("TECHNICIAN")
                .requestMatchers(HttpMethod.PUT, "/api/tickets/*/reject/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/tickets/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/tickets/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/tickets/*/comments/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/tickets/*/comments").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/tickets/comments/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/tickets/comments/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/tickets/*/attachments").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/tickets/*/attachments").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/tickets/attachments/**").authenticated()

                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2SuccessHandler)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}