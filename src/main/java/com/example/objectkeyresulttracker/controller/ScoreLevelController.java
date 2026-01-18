package com.example.objectkeyresulttracker.controller;

import com.example.objectkeyresulttracker.dto.ScoreLevelDTO;
import com.example.objectkeyresulttracker.service.ScoreLevelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/score-levels")
public class ScoreLevelController {

    private final ScoreLevelService scoreLevelService;

    public ScoreLevelController(ScoreLevelService scoreLevelService) {
        this.scoreLevelService = scoreLevelService;
    }

    @GetMapping
    public ResponseEntity<List<ScoreLevelDTO>> getAllScoreLevels() {
        return ResponseEntity.ok(scoreLevelService.getAllScoreLevels());
    }

    @PutMapping
    public ResponseEntity<List<ScoreLevelDTO>> updateScoreLevels(@RequestBody List<ScoreLevelDTO> levelDTOs) {
        return ResponseEntity.ok(scoreLevelService.updateScoreLevels(levelDTOs));
    }

    @PostMapping("/reset")
    public ResponseEntity<Void> resetToDefaults() {
        scoreLevelService.resetToDefaults();
        return ResponseEntity.ok().build();
    }
}
