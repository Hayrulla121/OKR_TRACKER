package com.example.objectkeyresulttracker.service;
import com.example.objectkeyresulttracker.dto.*;
import com.example.objectkeyresulttracker.entity.*;
import com.example.objectkeyresulttracker.repository.ScoreLevelRepository;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

import static java.lang.Double.parseDouble;

@Service
public class ScoreCalculationService {

    private final ScoreLevelRepository scoreLevelRepository;

    // Thread-local cache to avoid N+1 queries within a single request
    private final ThreadLocal<List<ScoreLevel>> scoreLevelCache = new ThreadLocal<>();

    public ScoreCalculationService(ScoreLevelRepository scoreLevelRepository) {
        this.scoreLevelRepository = scoreLevelRepository;
    }

    /**
     * Get score levels with caching to avoid N+1 queries
     */
    private List<ScoreLevel> getScoreLevels() {
        List<ScoreLevel> cached = scoreLevelCache.get();
        if (cached == null) {
            cached = scoreLevelRepository.findAllByOrderByDisplayOrderAsc();
            scoreLevelCache.set(cached);
        }
        return cached;
    }

    /**
     * Clear the thread-local cache (should be called after processing a request)
     */
    public void clearCache() {
        scoreLevelCache.remove();
    }

    // Default fallback level definitions (used if DB is empty)
    private static final Map<String, LevelInfo> DEFAULT_LEVELS = Map.of(
            "below", new LevelInfo(3.0, 4.24, "#d9534f"),
            "meets", new LevelInfo(4.25, 4.49, "#f0ad4e"),
            "good", new LevelInfo(4.50, 4.74, "#5cb85c"),
            "very_good", new LevelInfo(4.75, 4.99, "#28a745"),
            "exceptional", new LevelInfo(5.00, 5.00, "#1e7b34")
    );

    // Qualitative grades mapping
    private static final Map<String, QualitativeGrade> QUALITATIVE_GRADES = Map.of(
            "A", new QualitativeGrade(5.00, "exceptional"),
            "B", new QualitativeGrade(4.75, "very_good"),
            "C", new QualitativeGrade(4.50, "good"),
            "D", new QualitativeGrade(4.25, "meets"),
            "E", new QualitativeGrade(3.00, "below")
    );


    // calculate the score for a KR

    public ScoreResult calculateKeyResultScore(KeyResult kr) {
        if (kr.getMetricType() == KeyResult.MetricType.QUALITATIVE) {
            return calculateQualitativeScore(kr.getActualValue());
        }
        return calculateQuantitativeScore(
                parseDouble(kr.getActualValue()),
                kr.getMetricType(),
                kr.getThresholdBelow(),
                kr.getThresholdMeets(),
                kr.getThresholdGood(),
                kr.getThresholdVeryGood(),
                kr.getThresholdExceptional()
        );
    }

    private ScoreResult calculateQualitativeScore(String grade) {
        String normalizedGrade = grade != null ? grade.toUpperCase().trim() : "E";
        QualitativeGrade gradeInfo = QUALITATIVE_GRADES.getOrDefault(normalizedGrade,
                QUALITATIVE_GRADES.get("E"));

        return ScoreResult.builder()
                .score(gradeInfo.score())
                .level(gradeInfo.level())
                .color(getColorForLevel(gradeInfo.level()))
                .percentage(scoreToPercentage(gradeInfo.score()))
                .build();
    }


    private ScoreResult calculateQuantitativeScore(
            double actual, KeyResult.MetricType type,
            Double below, Double meets, Double good, Double veryGood, Double exceptional) {

        // Get dynamic score levels from database (cached)
        List<ScoreLevel> scoreLevels = getScoreLevels();

        // If no custom levels, use default threshold-to-score mapping
        if (scoreLevels.isEmpty()) {
            return calculateWithDefaultLevels(actual, type, below, meets, good, veryGood, exceptional);
        }

        // Map the 5 thresholds to the score levels
        Double[] thresholds = {below, meets, good, veryGood, exceptional};

        double score;
        String level;

        if (type == KeyResult.MetricType.HIGHER_BETTER) {
            // Find which threshold range the actual value falls into
            if (actual >= exceptional) {
                score = scoreLevels.get(scoreLevels.size() - 1).getScoreValue();
                level = scoreLevels.get(scoreLevels.size() - 1).getName().toLowerCase().replace(" ", "_");
            } else if (actual >= veryGood) {
                // Between veryGood and exceptional
                int idx = Math.min(scoreLevels.size() - 2, 3);
                double ratio = (actual - veryGood) / Math.max(exceptional - veryGood, 1);
                double startScore = scoreLevels.get(idx).getScoreValue();
                double endScore = scoreLevels.get(idx + 1).getScoreValue();
                score = startScore + ratio * (endScore - startScore);
                level = scoreLevels.get(idx).getName().toLowerCase().replace(" ", "_");
            } else if (actual >= good) {
                // Between good and veryGood
                int idx = Math.min(scoreLevels.size() - 3, 2);
                double ratio = (actual - good) / Math.max(veryGood - good, 1);
                double startScore = scoreLevels.get(idx).getScoreValue();
                double endScore = scoreLevels.get(idx + 1).getScoreValue();
                score = startScore + ratio * (endScore - startScore);
                level = scoreLevels.get(idx).getName().toLowerCase().replace(" ", "_");
            } else if (actual >= meets) {
                // Between meets and good
                int idx = Math.min(scoreLevels.size() - 4, 1);
                double ratio = (actual - meets) / Math.max(good - meets, 1);
                double startScore = scoreLevels.get(idx).getScoreValue();
                double endScore = scoreLevels.get(idx + 1).getScoreValue();
                score = startScore + ratio * (endScore - startScore);
                level = scoreLevels.get(idx).getName().toLowerCase().replace(" ", "_");
            } else if (actual >= below) {
                // Between below and meets
                double ratio = (actual - below) / Math.max(meets - below, 1);
                double startScore = scoreLevels.get(0).getScoreValue();
                double endScore = scoreLevels.get(1).getScoreValue();
                score = startScore + ratio * (endScore - startScore);
                level = scoreLevels.get(0).getName().toLowerCase().replace(" ", "_");
            } else {
                // Below minimum threshold
                score = scoreLevels.get(0).getScoreValue();
                level = scoreLevels.get(0).getName().toLowerCase().replace(" ", "_");
            }
        } else {
            // Lower is better - reverse the logic
            if (actual <= exceptional) {
                score = scoreLevels.get(scoreLevels.size() - 1).getScoreValue();
                level = scoreLevels.get(scoreLevels.size() - 1).getName().toLowerCase().replace(" ", "_");
            } else if (actual <= veryGood) {
                int idx = Math.min(scoreLevels.size() - 2, 3);
                double ratio = 1 - (actual - exceptional) / Math.max(veryGood - exceptional, 1);
                double startScore = scoreLevels.get(idx).getScoreValue();
                double endScore = scoreLevels.get(idx + 1).getScoreValue();
                score = startScore + ratio * (endScore - startScore);
                level = scoreLevels.get(idx).getName().toLowerCase().replace(" ", "_");
            } else if (actual <= good) {
                int idx = Math.min(scoreLevels.size() - 3, 2);
                double ratio = 1 - (actual - veryGood) / Math.max(good - veryGood, 1);
                double startScore = scoreLevels.get(idx).getScoreValue();
                double endScore = scoreLevels.get(idx + 1).getScoreValue();
                score = startScore + ratio * (endScore - startScore);
                level = scoreLevels.get(idx).getName().toLowerCase().replace(" ", "_");
            } else if (actual <= meets) {
                int idx = Math.min(scoreLevels.size() - 4, 1);
                double ratio = 1 - (actual - good) / Math.max(meets - good, 1);
                double startScore = scoreLevels.get(idx).getScoreValue();
                double endScore = scoreLevels.get(idx + 1).getScoreValue();
                score = startScore + ratio * (endScore - startScore);
                level = scoreLevels.get(idx).getName().toLowerCase().replace(" ", "_");
            } else if (actual <= below) {
                double ratio = 1 - (actual - meets) / Math.max(below - meets, 1);
                double startScore = scoreLevels.get(0).getScoreValue();
                double endScore = scoreLevels.get(1).getScoreValue();
                score = startScore + ratio * (endScore - startScore);
                level = scoreLevels.get(0).getName().toLowerCase().replace(" ", "_");
            } else {
                score = scoreLevels.get(0).getScoreValue();
                level = scoreLevels.get(0).getName().toLowerCase().replace(" ", "_");
            }
        }

        double minScore = scoreLevels.get(0).getScoreValue();
        double maxScore = scoreLevels.get(scoreLevels.size() - 1).getScoreValue();
        score = Math.min(Math.max(score, minScore), maxScore);
        score = Math.round(score * 100.0) / 100.0;

        return ScoreResult.builder()
                .score(score)
                .level(level)
                .color(getColorForLevel(level))
                .percentage(scoreToPercentage(score))
                .build();
    }

    private ScoreResult calculateWithDefaultLevels(
            double actual, KeyResult.MetricType type,
            Double below, Double meets, Double good, Double veryGood, Double exceptional) {

        double score;
        String level;

        if (type == KeyResult.MetricType.HIGHER_BETTER) {
            if (actual >= exceptional) {
                score = 5.00;
                level = "exceptional";
            } else if (actual >= veryGood) {
                double ratio = (actual - veryGood) / Math.max(exceptional - veryGood, 1);
                score = 4.75 + ratio * 0.25;
                level = "very_good";
            } else if (actual >= good) {
                double ratio = (actual - good) / Math.max(veryGood - good, 1);
                score = 4.50 + ratio * 0.25;
                level = "good";
            } else if (actual >= meets) {
                double ratio = (actual - meets) / Math.max(good - meets, 1);
                score = 4.25 + ratio * 0.25;
                level = "meets";
            } else if (actual >= below) {
                double ratio = (actual - below) / Math.max(meets - below, 1);
                score = 3.00 + ratio * 1.25;
                level = "below";
            } else {
                score = 3.00;
                level = "below";
            }
        } else {
            if (actual <= exceptional) {
                score = 5.00;
                level = "exceptional";
            } else if (actual <= veryGood) {
                double ratio = 1 - (actual - exceptional) / Math.max(veryGood - exceptional, 1);
                score = 4.75 + ratio * 0.25;
                level = "very_good";
            } else if (actual <= good) {
                double ratio = 1 - (actual - veryGood) / Math.max(good - veryGood, 1);
                score = 4.50 + ratio * 0.25;
                level = "good";
            } else if (actual <= meets) {
                double ratio = 1 - (actual - good) / Math.max(meets - good, 1);
                score = 4.25 + ratio * 0.25;
                level = "meets";
            } else if (actual <= below) {
                double ratio = 1 - (actual - meets) / Math.max(below - meets, 1);
                score = 3.00 + ratio * 1.25;
                level = "below";
            } else {
                score = 3.00;
                level = "below";
            }
        }

        score = Math.min(Math.max(score, 3.0), 5.0);
        score = Math.round(score * 100.0) / 100.0;

        return ScoreResult.builder()
                .score(score)
                .level(level)
                .color(getColorForLevel(level))
                .percentage(scoreToPercentage(score))
                .build();
    }

    /**
     * Calculate weighted score for an Objective (average of KR scores)
     */
    public ScoreResult calculateObjectiveScore(List<KeyResult> keyResults) {
        if (keyResults == null || keyResults.isEmpty()) {
            return emptyScore();
        }

        double totalScore = 0;
        for (KeyResult kr : keyResults) {
            ScoreResult krScore = calculateKeyResultScore(kr);
            totalScore += krScore.getScore();
        }

        double avgScore = totalScore / keyResults.size();
        return createScoreResult(avgScore);
    }
    /**
     * Calculate weighted score for a Department
     */
    public ScoreResult calculateDepartmentScore(List<Objective> objectives) {
        if (objectives == null || objectives.isEmpty()) {
            return emptyScore();
        }

        double weightedSum = 0;
        double totalWeight = 0;

        // Count objectives with key results for default weight calculation
        long objectivesWithKRs = objectives.stream()
                .filter(obj -> obj.getKeyResults() != null && !obj.getKeyResults().isEmpty())
                .count();

        if (objectivesWithKRs == 0) {
            return emptyScore();
        }

        for (Objective obj : objectives) {
            // Skip objectives with no key results
            if (obj.getKeyResults() == null || obj.getKeyResults().isEmpty()) {
                continue;
            }

            double weight = obj.getWeight() != null ? obj.getWeight() : 100.0 / objectivesWithKRs;
            ScoreResult objScore = calculateObjectiveScore(obj.getKeyResults());
            weightedSum += objScore.getScore() * weight;
            totalWeight += weight;
        }

        double avgScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
        return createScoreResult(avgScore);
    }

    private ScoreResult createScoreResult(double score) {
        String level = getLevelForScore(score);
        return ScoreResult.builder()
                .score(Math.round(score * 100.0) / 100.0)
                .level(level)
                .color(getColorForLevel(level))
                .percentage(scoreToPercentage(score))
                .build();
    }

    private String getLevelForScore(double score) {
        List<ScoreLevel> levels = getScoreLevels();

        if (levels.isEmpty()) {
            // Fallback to default logic
            if (score >= 5.00) return "exceptional";
            if (score >= 4.75) return "very_good";
            if (score >= 4.50) return "good";
            if (score >= 4.25) return "meets";
            return "below";
        }

        // Find the appropriate level based on score value
        for (int i = levels.size() - 1; i >= 0; i--) {
            if (score >= levels.get(i).getScoreValue()) {
                return levels.get(i).getName().toLowerCase().replace(" ", "_");
            }
        }

        return levels.get(0).getName().toLowerCase().replace(" ", "_");
    }

    private String getColorForLevel(String level) {
        List<ScoreLevel> levels = getScoreLevels();

        if (levels.isEmpty()) {
            return DEFAULT_LEVELS.getOrDefault(level, DEFAULT_LEVELS.get("below")).color();
        }

        String normalizedLevel = level.replace("_", " ");
        for (ScoreLevel scoreLevel : levels) {
            if (scoreLevel.getName().equalsIgnoreCase(normalizedLevel)) {
                return scoreLevel.getColor();
            }
        }

        return levels.get(0).getColor();
    }

    private double scoreToPercentage(double score) {
        List<ScoreLevel> levels = getScoreLevels();

        double minScore = 3.0;
        double maxScore = 5.0;

        if (!levels.isEmpty()) {
            minScore = levels.get(0).getScoreValue();
            maxScore = levels.get(levels.size() - 1).getScoreValue();
        }

        double range = maxScore - minScore;
        if (range == 0) return 0.0;

        return Math.round(((score - minScore) / range) * 1000.0) / 10.0;
    }

    private ScoreResult emptyScore() {
        return ScoreResult.builder()
                .score(3.0)  // Use minimum valid score instead of 0.0
                .level("below")
                .color(getColorForLevel("below"))
                .percentage(0.0)
                .build();
    }

    private double parseDouble(String value) {
        try {
            return value != null ? Double.parseDouble(value) : 0.0;
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    record LevelInfo(double min, double max, String color) {}
    record QualitativeGrade(double score, String level) {}
}
