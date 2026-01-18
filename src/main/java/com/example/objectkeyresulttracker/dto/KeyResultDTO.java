package com.example.objectkeyresulttracker.dto;


import com.example.objectkeyresulttracker.entity.KeyResult.MetricType;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeyResultDTO {
    private String id;
    private String name;
    private String description;
    private MetricType metricType;
    private String unit;
    private Integer weight;
    private ThresholdDTO thresholds;
    private String actualValue;
    private String objectiveId;
    private ScoreResult score; // Computed field
}

