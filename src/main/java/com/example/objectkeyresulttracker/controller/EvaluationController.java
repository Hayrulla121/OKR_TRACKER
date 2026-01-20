package com.example.objectkeyresulttracker.controller;

import com.example.objectkeyresulttracker.dto.EvaluationCreateRequest;
import com.example.objectkeyresulttracker.dto.EvaluationDTO;
import com.example.objectkeyresulttracker.security.UserDetailsImpl;
import com.example.objectkeyresulttracker.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for evaluation endpoints
 */
@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class EvaluationController {

    private final EvaluationService evaluationService;

    /**
     * Create a new evaluation
     * Only Directors, HR, and Business Block leaders can create evaluations
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('DIRECTOR', 'HR', 'BUSINESS_BLOCK', 'ADMIN')")
    public ResponseEntity<EvaluationDTO> createEvaluation(
            @RequestBody EvaluationCreateRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        EvaluationDTO evaluation = evaluationService.createEvaluation(request, userDetails.getId());
        return ResponseEntity.ok(evaluation);
    }

    /**
     * Submit an evaluation (change from DRAFT to SUBMITTED)
     */
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'HR', 'BUSINESS_BLOCK', 'ADMIN')")
    public ResponseEntity<EvaluationDTO> submitEvaluation(
            @PathVariable UUID id,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        EvaluationDTO evaluation = evaluationService.submitEvaluation(id, userDetails.getId());
        return ResponseEntity.ok(evaluation);
    }

    /**
     * Update an existing evaluation
     * Allows evaluators to modify their submitted evaluations
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'HR', 'BUSINESS_BLOCK', 'ADMIN')")
    public ResponseEntity<EvaluationDTO> updateEvaluation(
            @PathVariable UUID id,
            @RequestBody EvaluationCreateRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        EvaluationDTO evaluation = evaluationService.updateEvaluation(id, request, userDetails.getId());
        return ResponseEntity.ok(evaluation);
    }

    /**
     * Get all evaluations for a specific target (department or employee)
     */
    @GetMapping("/target/{type}/{id}")
    public ResponseEntity<List<EvaluationDTO>> getEvaluationsForTarget(
            @PathVariable String type,
            @PathVariable UUID id) {
        List<EvaluationDTO> evaluations = evaluationService.getEvaluationsForTarget(type.toUpperCase(), id);
        return ResponseEntity.ok(evaluations);
    }

    /**
     * Get current user's evaluations
     */
    @GetMapping("/my")
    public ResponseEntity<List<EvaluationDTO>> getMyEvaluations(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<EvaluationDTO> evaluations = evaluationService.getEvaluationsByEvaluator(userDetails.getId());
        return ResponseEntity.ok(evaluations);
    }

    /**
     * Get all evaluations (admin debug endpoint)
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EvaluationDTO>> getAllEvaluations() {
        List<EvaluationDTO> evaluations = evaluationService.getAllEvaluations();
        return ResponseEntity.ok(evaluations);
    }

    /**
     * Delete a draft evaluation
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'HR', 'BUSINESS_BLOCK', 'ADMIN')")
    public ResponseEntity<Void> deleteEvaluation(
            @PathVariable UUID id,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        evaluationService.deleteEvaluation(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
