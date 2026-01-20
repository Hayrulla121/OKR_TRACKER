package com.example.objectkeyresulttracker.dto;

import com.example.objectkeyresulttracker.entity.EvaluatorType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for creating a new evaluation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationCreateRequest {
    private String targetType;          // "DEPARTMENT" or "EMPLOYEE"
    private UUID targetId;
    private EvaluatorType evaluatorType;
    private Double numericRating;       // For DIRECTOR (4.25-5.0) or BUSINESS_BLOCK (1-5)
    private Integer starRating;         // For DIRECTOR (1-5 stars, converted to 4.25-5.0)
    private String letterRating;        // For HR (A, B, C, D)
    private String comment;
}
