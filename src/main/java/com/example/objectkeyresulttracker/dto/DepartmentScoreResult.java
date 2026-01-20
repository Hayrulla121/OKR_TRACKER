package com.example.objectkeyresulttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for department score with multi-source evaluations
 * Combines automatic OKR score with manual evaluations from Director, HR, and Business Block
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentScoreResult {
    // Automatic OKR (60% weight)
    private Double automaticOkrScore;        // 3.0-5.0
    private Double automaticOkrPercentage;   // 0-100%

    // Director evaluation (20% weight)
    private Double directorEvaluation;       // 4.25-5.0 (converted from 1-5 stars)
    private Integer directorStars;           // 1-5 stars (for UI display)
    private String directorComment;          // Director's comment

    // HR evaluation (20% weight)
    private String hrEvaluationLetter;       // A, B, C, D
    private Double hrEvaluationNumeric;      // 5.0, 4.75, 4.5, 4.25 (converted)
    private String hrComment;                // HR's comment

    // Business Block (separate display, no weight)
    private Double businessBlockEvaluation;  // 1-5
    private String businessBlockComment;     // Business Block's comment

    // Combined final score
    private Double finalCombinedScore;       // Weighted: auto×60% + director×20% + hr×20%
    private Double finalPercentage;          // 0-100%
    private String scoreLevel;               // below/meets/good/very_good/exceptional
    private String color;                    // hex color

    // Evaluation status flags
    private Boolean hasDirectorEvaluation;
    private Boolean hasHrEvaluation;
    private Boolean hasBusinessBlockEvaluation;
}
