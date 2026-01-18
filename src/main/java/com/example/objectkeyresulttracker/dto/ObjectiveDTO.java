package com.example.objectkeyresulttracker.dto;


import lombok.*;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObjectiveDTO {
    private String id;
    private String name;
    private Integer weight;
    private String departmentId;
    private List<KeyResultDTO> keyResults;
    private ScoreResult score; // Computed field
}