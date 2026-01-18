package com.example.objectkeyresulttracker.service;

import com.example.objectkeyresulttracker.dto.ScoreLevelDTO;
import com.example.objectkeyresulttracker.entity.ScoreLevel;
import com.example.objectkeyresulttracker.repository.ScoreLevelRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScoreLevelService {

    private final ScoreLevelRepository scoreLevelRepository;

    public ScoreLevelService(ScoreLevelRepository scoreLevelRepository) {
        this.scoreLevelRepository = scoreLevelRepository;
    }

    @PostConstruct
    public void initializeDefaultLevels() {
        if (scoreLevelRepository.count() == 0) {
            // Create default score levels
            List<ScoreLevel> defaultLevels = List.of(
                    ScoreLevel.builder()
                            .name("Below")
                            .scoreValue(3.0)
                            .color("#d9534f")
                            .displayOrder(0)
                            .isDefault(true)
                            .build(),
                    ScoreLevel.builder()
                            .name("Meets")
                            .scoreValue(4.25)
                            .color("#f0ad4e")
                            .displayOrder(1)
                            .isDefault(true)
                            .build(),
                    ScoreLevel.builder()
                            .name("Good")
                            .scoreValue(4.5)
                            .color("#5cb85c")
                            .displayOrder(2)
                            .isDefault(true)
                            .build(),
                    ScoreLevel.builder()
                            .name("Very Good")
                            .scoreValue(4.75)
                            .color("#28a745")
                            .displayOrder(3)
                            .isDefault(true)
                            .build(),
                    ScoreLevel.builder()
                            .name("Exceptional")
                            .scoreValue(5.0)
                            .color("#1e7b34")
                            .displayOrder(4)
                            .isDefault(true)
                            .build()
            );
            scoreLevelRepository.saveAll(defaultLevels);
        }
    }

    public List<ScoreLevelDTO> getAllScoreLevels() {
        return scoreLevelRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ScoreLevelDTO> updateScoreLevels(List<ScoreLevelDTO> levelDTOs) {
        // Delete all existing levels
        scoreLevelRepository.deleteAll();

        // Create new levels from the provided list
        List<ScoreLevel> newLevels = levelDTOs.stream()
                .map(dto -> ScoreLevel.builder()
                        .name(dto.getName())
                        .scoreValue(dto.getScoreValue())
                        .color(dto.getColor())
                        .displayOrder(dto.getDisplayOrder())
                        .isDefault(false)
                        .build())
                .collect(Collectors.toList());

        List<ScoreLevel> savedLevels = scoreLevelRepository.saveAll(newLevels);

        return savedLevels.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void resetToDefaults() {
        scoreLevelRepository.deleteAll();
        initializeDefaultLevels();
    }

    private ScoreLevelDTO toDTO(ScoreLevel entity) {
        return ScoreLevelDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .scoreValue(entity.getScoreValue())
                .color(entity.getColor())
                .displayOrder(entity.getDisplayOrder())
                .build();
    }
}
