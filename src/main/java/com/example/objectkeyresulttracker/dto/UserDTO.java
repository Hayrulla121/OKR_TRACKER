package com.example.objectkeyresulttracker.dto;

import com.example.objectkeyresulttracker.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for User information (excluding password)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private Role role;
    private String departmentId;
    private String departmentName;
}
