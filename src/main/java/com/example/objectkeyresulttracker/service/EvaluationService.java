package com.example.objectkeyresulttracker.service;

import com.example.objectkeyresulttracker.dto.EvaluationCreateRequest;
import com.example.objectkeyresulttracker.dto.EvaluationDTO;
import com.example.objectkeyresulttracker.entity.*;
import com.example.objectkeyresulttracker.repository.EvaluationRepository;
import com.example.objectkeyresulttracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing evaluations
 */
@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final UserRepository userRepository;

    /**
     * Create a new evaluation
     */
    @Transactional
    public EvaluationDTO createEvaluation(EvaluationCreateRequest request, UUID evaluatorId) {
        User evaluator = userRepository.findById(evaluatorId)
                .orElseThrow(() -> new IllegalArgumentException("Evaluator not found"));

        // Validate evaluator has permission to evaluate
        validateEvaluationPermissions(evaluator, request.getEvaluatorType(), request.getTargetType());

        // Check for duplicate evaluations
        if (evaluationRepository.existsByEvaluatorAndTargetTypeAndTargetIdAndEvaluatorType(
                evaluator, request.getTargetType(), request.getTargetId(), request.getEvaluatorType())) {
            throw new IllegalArgumentException("You have already evaluated this " + request.getTargetType().toLowerCase());
        }

        // Convert star rating to numeric if provided (for Director)
        Double numericRating = request.getNumericRating();
        if (request.getStarRating() != null && request.getEvaluatorType() == EvaluatorType.DIRECTOR) {
            numericRating = convertStarsToNumeric(request.getStarRating());
        }

        // Validate rating based on evaluator type
        validateRating(request.getEvaluatorType(), numericRating, request.getLetterRating());

        // Create evaluation
        Evaluation evaluation = Evaluation.builder()
                .evaluator(evaluator)
                .evaluatorType(request.getEvaluatorType())
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .numericRating(numericRating)
                .letterRating(request.getLetterRating())
                .comment(request.getComment())
                .status(EvaluationStatus.DRAFT)
                .build();

        evaluation = evaluationRepository.save(evaluation);

        return convertToDTO(evaluation);
    }

    /**
     * Submit an evaluation (change status from DRAFT to SUBMITTED)
     */
    @Transactional
    public EvaluationDTO submitEvaluation(UUID evaluationId, UUID evaluatorId) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new IllegalArgumentException("Evaluation not found"));

        // Verify ownership
        if (!evaluation.getEvaluator().getId().equals(evaluatorId)) {
            throw new IllegalArgumentException("You can only submit your own evaluations");
        }

        // Only draft evaluations can be submitted
        if (evaluation.getStatus() != EvaluationStatus.DRAFT) {
            throw new IllegalArgumentException("Only draft evaluations can be submitted");
        }

        evaluation.setStatus(EvaluationStatus.SUBMITTED);
        evaluation = evaluationRepository.save(evaluation);

        return convertToDTO(evaluation);
    }

    /**
     * Get all evaluations for a target
     */
    public List<EvaluationDTO> getEvaluationsForTarget(String targetType, UUID targetId) {
        return evaluationRepository.findByTargetTypeAndTargetId(targetType, targetId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get evaluations created by a specific evaluator
     */
    public List<EvaluationDTO> getEvaluationsByEvaluator(UUID evaluatorId) {
        return evaluationRepository.findByEvaluatorId(evaluatorId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Delete an evaluation (only drafts can be deleted)
     */
    @Transactional
    public void deleteEvaluation(UUID evaluationId, UUID evaluatorId) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new IllegalArgumentException("Evaluation not found"));

        // Verify ownership
        if (!evaluation.getEvaluator().getId().equals(evaluatorId)) {
            throw new IllegalArgumentException("You can only delete your own evaluations");
        }

        // Only drafts can be deleted
        if (evaluation.getStatus() != EvaluationStatus.DRAFT) {
            throw new IllegalArgumentException("Only draft evaluations can be deleted");
        }

        evaluationRepository.delete(evaluation);
    }

    /**
     * Validate evaluator has permission to create this type of evaluation
     */
    private void validateEvaluationPermissions(User evaluator, EvaluatorType evaluatorType, String targetType) {
        Role userRole = evaluator.getRole();

        switch (evaluatorType) {
            case DIRECTOR:
                if (userRole != Role.DIRECTOR && userRole != Role.ADMIN) {
                    throw new IllegalArgumentException("Only Directors can create Director evaluations");
                }
                break;
            case HR:
                if (userRole != Role.HR && userRole != Role.ADMIN) {
                    throw new IllegalArgumentException("Only HR can create HR evaluations");
                }
                break;
            case BUSINESS_BLOCK:
                if (userRole != Role.BUSINESS_BLOCK && userRole != Role.ADMIN) {
                    throw new IllegalArgumentException("Only Business Block leaders can create Business Block evaluations");
                }
                if (!"DEPARTMENT".equals(targetType)) {
                    throw new IllegalArgumentException("Business Block can only evaluate departments");
                }
                break;
        }
    }

    /**
     * Validate rating based on evaluator type
     */
    private void validateRating(EvaluatorType evaluatorType, Double numericRating, String letterRating) {
        switch (evaluatorType) {
            case DIRECTOR:
                if (numericRating == null || numericRating < 4.25 || numericRating > 5.0) {
                    throw new IllegalArgumentException("Director rating must be between 4.25 and 5.0");
                }
                break;
            case HR:
                if (letterRating == null || !List.of("A", "B", "C", "D").contains(letterRating)) {
                    throw new IllegalArgumentException("HR rating must be A, B, C, or D");
                }
                break;
            case BUSINESS_BLOCK:
                if (numericRating == null || numericRating < 1 || numericRating > 5) {
                    throw new IllegalArgumentException("Business Block rating must be between 1 and 5");
                }
                break;
        }
    }

    /**
     * Convert star rating (1-5) to numeric score (4.25-5.0)
     */
    private Double convertStarsToNumeric(Integer stars) {
        if (stars < 1 || stars > 5) {
            throw new IllegalArgumentException("Star rating must be between 1 and 5");
        }
        return 4.25 + (stars - 1) * 0.1875;
    }

    /**
     * Convert Evaluation entity to DTO
     */
    private EvaluationDTO convertToDTO(Evaluation evaluation) {
        return EvaluationDTO.builder()
                .id(evaluation.getId())
                .evaluatorId(evaluation.getEvaluator().getId())
                .evaluatorName(evaluation.getEvaluator().getFullName())
                .evaluatorType(evaluation.getEvaluatorType())
                .targetType(evaluation.getTargetType())
                .targetId(evaluation.getTargetId())
                .numericRating(evaluation.getNumericRating())
                .letterRating(evaluation.getLetterRating())
                .comment(evaluation.getComment())
                .status(evaluation.getStatus())
                .createdAt(evaluation.getCreatedAt())
                .updatedAt(evaluation.getUpdatedAt())
                .build();
    }
}
