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
    private ScoreResult score; // Computed field
}