package com.example.objectkeyresulttracker.dto;

import com.example.objectkeyresulttracker.entity.EvaluationStatus;
import com.example.objectkeyresulttracker.entity.EvaluatorType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Evaluation entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationDTO {
    private UUID id;
    private UUID evaluatorId;
    private String evaluatorName;
    private EvaluatorType evaluatorType;
    private String targetType;
    private UUID targetId;
    private Double numericRating;
    private String letterRating;
    private String comment;
    private EvaluationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
