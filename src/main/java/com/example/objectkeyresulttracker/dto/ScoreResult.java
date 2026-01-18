package com.example.objectkeyresulttracker.dto;


import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreResult {
    private Double score;
    private String level;      // below, meets, good, very_good, exceptional
    private String color;
    private Double percentage; // Score as percentage (0-100)
}