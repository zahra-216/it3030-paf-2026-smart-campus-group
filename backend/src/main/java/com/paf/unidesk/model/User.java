package com.paf.unidesk.model;

import com.paf.unidesk.enums.OAuthProvider;
import com.paf.unidesk.enums.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data // Lombok annotation to generate getters, setters, toString, equals, and hashCode methods
@Builder // Lombok annotation to implement the builder pattern for this class
@NoArgsConstructor // Lombok annotation to generate empty constructor
@AllArgsConstructor // Lombok annotation to generate constructor with all fields as parameters
@EqualsAndHashCode(callSuper = true) // Lombok annotation to include fields from BaseEntity in equals and hashCode
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String profilePicture;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OAuthProvider oauthProvider;

    private String oauthId;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isProfileComplete = false;
}