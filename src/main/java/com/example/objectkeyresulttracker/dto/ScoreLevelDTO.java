package com.example.objectkeyresulttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreLevelDTO {
    private String id;
    private String name;
    private Double scoreValue;
    private String color;
    private Integer displayOrder;
}
