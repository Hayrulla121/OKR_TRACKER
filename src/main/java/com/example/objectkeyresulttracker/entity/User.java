package com.example.objectkeyresulttracker.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * User entity representing a person in the organization.
 * Users have roles that determine their permissions and evaluation capabilities.
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Unique username for login
     */
    @Column(unique = true, nullable = false)
    private String username;

    /**
     * Unique email address
     */
    @Column(unique = true, nullable = false)
    private String email;

    /**
     * BCrypt hashed password
     */
    @Column(nullable = false)
    private String password;

    /**
     * Full display name
     */
    private String fullName;

    /**
     * User's role in the organization
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /**
     * Department the user belongs to (optional for some roles)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    /**
     * Timestamp when user was created
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when user was last updated
     */
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
