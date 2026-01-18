package com.example.objectkeyresulttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThresholdDTO {
    private Double below;
    private Double meets;
    private Double good;
    private Double veryGood;
    private Double exceptional;
}
