package com.example.objectkeyresulttracker.dto;


import lombok.*;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentDTO {
    private String id;
    private String name;
    private List<ObjectiveDTO> objectives;
    private ScoreResult score; // Automatic OKR score (computed from key results)
    private ScoreResult finalScore; // Final combined score (60% OKR + 20% Director + 20% HR)
    private Boolean hasAllEvaluations; // True if department has both Director and HR evaluations
}