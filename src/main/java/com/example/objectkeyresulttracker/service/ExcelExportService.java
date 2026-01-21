package com.example.objectkeyresulttracker.service;

import com.example.objectkeyresulttracker.dto.DepartmentDTO;
import com.example.objectkeyresulttracker.dto.KeyResultDTO;
import com.example.objectkeyresulttracker.dto.ObjectiveDTO;
import com.example.objectkeyresulttracker.entity.KeyResult.MetricType;
import com.example.objectkeyresulttracker.entity.ScoreLevel;
import com.example.objectkeyresulttracker.repository.ScoreLevelRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFFormulaEvaluator;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFSheetConditionalFormatting;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class ExcelExportService {

    private final ScoreLevelRepository scoreLevelRepository;

    // Default score levels if none in database
    private static final List<DefaultLevel> DEFAULT_LEVELS = List.of(
            new DefaultLevel("Ниже нормы", 3.0, "#dc3545"),
            new DefaultLevel("Норма", 4.25, "#f0ad4e"),
            new DefaultLevel("Хорошо", 4.5, "#5cb85c"),
            new DefaultLevel("Очень хорошо", 4.75, "#28a745"),
            new DefaultLevel("Исключительно", 5.0, "#1e7b34")
    );

    public ExcelExportService(ScoreLevelRepository scoreLevelRepository) {
        this.scoreLevelRepository = scoreLevelRepository;
    }

    private record DefaultLevel(String name, double scoreValue, String color) {}

    private List<ScoreLevel> getScoreLevels() {
        List<ScoreLevel> levels = scoreLevelRepository.findAllByOrderByDisplayOrderAsc();
        if (levels.isEmpty()) {
            // Create default levels as ScoreLevel objects
            List<ScoreLevel> defaults = new ArrayList<>();
            for (int i = 0; i < DEFAULT_LEVELS.size(); i++) {
                DefaultLevel dl = DEFAULT_LEVELS.get(i);
                defaults.add(ScoreLevel.builder()
                        .name(dl.name())
                        .scoreValue(dl.scoreValue())
                        .color(dl.color())
                        .displayOrder(i)
                        .build());
            }
            return defaults;
        }
        // Sort by scoreValue ascending
        levels.sort(Comparator.comparingDouble(ScoreLevel::getScoreValue));
        return levels;
    }

    private String[] buildHeaders(List<ScoreLevel> levels) {
        List<String> headers = new ArrayList<>();
        headers.add("Департамент");
        headers.add("Цель");
        headers.add("Вес цели");
        headers.add("Ключевой результат");
        headers.add("Тип");
        headers.add("Факт");
        headers.add("Единица измерения");
        // Add dynamic level names
        for (ScoreLevel level : levels) {
            headers.add(level.getName());
        }
        headers.add("Оценка");
        headers.add("Уровень исполнения");
        return headers.toArray(new String[0]);
    }

    public byte[] exportToExcel(List<DepartmentDTO> departments) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            // Get dynamic score levels
            List<ScoreLevel> scoreLevels = getScoreLevels();
            String[] headers = buildHeaders(scoreLevels);
            int numLevels = scoreLevels.size();
            int thresholdStartCol = 7; // Column H (0-indexed: 7)
            int scoreCol = thresholdStartCol + numLevels; // After all threshold columns
            int levelCol = scoreCol + 1;

            XSSFSheet sheet = workbook.createSheet("Экспорт OKR");

            // Create styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle centeredStyle = createCenteredStyle(workbook);

            // Create threshold styles for each score level
            List<CellStyle> thresholdStyles = new ArrayList<>();
            for (ScoreLevel level : scoreLevels) {
                thresholdStyles.add(createThresholdStyle(workbook, hexToRgb(level.getColor())));
            }

            // Create header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Add data
            int rowIdx = 1;
            for (DepartmentDTO dept : departments) {
                if (dept == null || dept.getObjectives() == null || dept.getObjectives().isEmpty()) {
                    continue;
                }
                int deptStartRow = rowIdx;

                for (ObjectiveDTO obj : dept.getObjectives()) {
                    if (obj == null || obj.getKeyResults() == null || obj.getKeyResults().isEmpty()) {
                        continue;
                    }
                    int objStartRow = rowIdx;
                    List<KeyResultDTO> krs = obj.getKeyResults();

                    for (KeyResultDTO kr : krs) {
                        if (kr == null) {
                            continue;
                        }

                        Row row = sheet.createRow(rowIdx);

                        // Department (only in first row of dept)
                        if (rowIdx == deptStartRow) {
                            Cell deptCell = row.createCell(0);
                            deptCell.setCellValue(dept.getName() != null ? dept.getName() : "");
                            deptCell.setCellStyle(centeredStyle);
                        }

                        // Objective (only in first row of obj)
                        if (rowIdx == objStartRow) {
                            Cell objCell = row.createCell(1);
                            objCell.setCellValue(obj.getName() != null ? obj.getName() : "");
                            objCell.setCellStyle(centeredStyle);

                            Cell weightCell = row.createCell(2);
                            weightCell.setCellValue((obj.getWeight() != null ? obj.getWeight() : 0) + "%");
                            weightCell.setCellStyle(centeredStyle);
                        }

                        // Key Result details
                        row.createCell(3).setCellValue(kr.getName() != null ? kr.getName() : "");
                        row.createCell(4).setCellValue(getMetricTypeDisplay(kr.getMetricType() != null ? kr.getMetricType().name() : ""));

                        // Actual value as number for formulas
                        Cell actualCell = row.createCell(5);
                        if (kr.getMetricType() == MetricType.QUALITATIVE) {
                            actualCell.setCellValue(kr.getActualValue() != null ? kr.getActualValue() : "E");
                        } else {
                            try {
                                double actualValue = Double.parseDouble(kr.getActualValue() != null ? kr.getActualValue() : "0");
                                actualCell.setCellValue(actualValue);
                            } catch (NumberFormatException e) {
                                actualCell.setCellValue(0);
                            }
                        }
                        actualCell.setCellStyle(centeredStyle);

                        row.createCell(6).setCellValue(kr.getUnit() != null ? kr.getUnit() : "");

                        // Thresholds - dynamic based on number of levels
                        if (kr.getMetricType() == MetricType.QUALITATIVE) {
                            // For qualitative, use letter grades mapped to levels
                            String[] grades = {"E", "D", "C", "B", "A"};
                            for (int i = 0; i < numLevels; i++) {
                                Cell cell = row.createCell(thresholdStartCol + i);
                                // Map level index to grade (0=E, 1=D, etc.)
                                int gradeIdx = Math.min(i, grades.length - 1);
                                cell.setCellValue(grades[gradeIdx]);
                                cell.setCellStyle(thresholdStyles.get(i));
                            }

                            // Score formula for qualitative (dynamic based on levels)
                            Cell scoreCellQ = row.createCell(scoreCol);
                            String qualFormula = createQualitativeScoreFormula(rowIdx + 1, scoreLevels);
                            scoreCellQ.setCellFormula(qualFormula);

                            // Performance Level formula for qualitative
                            Cell levelCellQ = row.createCell(levelCol);
                            String qualLevelFormula = createQualitativeLevelFormula(rowIdx + 1, scoreLevels);
                            levelCellQ.setCellFormula(qualLevelFormula);
                        } else {
                            // Quantitative thresholds - with null safety
                            Double[] thresholds = getThresholdValues(kr, numLevels);
                            boolean hasValidThresholds = kr.getThresholds() != null;

                            for (int i = 0; i < numLevels; i++) {
                                Cell cell = row.createCell(thresholdStartCol + i);
                                if (hasValidThresholds) {
                                    cell.setCellValue(thresholds[i]);
                                    cell.setCellStyle(thresholdStyles.get(i));
                                } else {
                                    cell.setCellValue("N/A");
                                    cell.setCellStyle(centeredStyle);
                                }
                            }

                            // Score calculation formula (dynamic)
                            Cell scoreCellNum = row.createCell(scoreCol);
                            if (hasValidThresholds) {
                                String metricType = kr.getMetricType() != null ? kr.getMetricType().name() : "HIGHER_BETTER";
                                String scoreFormula = createDynamicScoreFormula(rowIdx + 1, metricType, numLevels, thresholdStartCol, scoreLevels);
                                scoreCellNum.setCellFormula(scoreFormula);
                            } else {
                                scoreCellNum.setCellValue("N/A");
                            }

                            // Performance Level formula (dynamic)
                            Cell levelCellNum = row.createCell(levelCol);
                            if (hasValidThresholds) {
                                String levelFormula = createDynamicLevelFormula(rowIdx + 1, scoreCol, scoreLevels);
                                levelCellNum.setCellFormula(levelFormula);
                            } else {
                                levelCellNum.setCellValue("Нет данных");
                            }
                        }

                        rowIdx++;
                    }

                    // Merge objective cells if multiple KRs
                    if (krs.size() > 1) {
                        int objEndRow = rowIdx - 1;
                        if (objEndRow > objStartRow) {
                            sheet.addMergedRegion(new CellRangeAddress(objStartRow, objEndRow, 1, 1));
                            sheet.addMergedRegion(new CellRangeAddress(objStartRow, objEndRow, 2, 2));
                        }
                    }
                }

                // Merge department cells
                int deptEndRow = rowIdx - 1;
                if (deptEndRow > deptStartRow) {
                    sheet.addMergedRegion(new CellRangeAddress(deptStartRow, deptEndRow, 0, 0));
                }
            }

            // Add conditional formatting for Score column - colors based on score value
            int lastDataRow = rowIdx - 1;
            if (lastDataRow > 0) {
                addDynamicScoreConditionalFormatting(sheet, lastDataRow, scoreCol, levelCol, scoreLevels);
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Evaluate all formulas
            XSSFFormulaEvaluator.evaluateAllFormulaCells(workbook);

            workbook.write(outputStream);
            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Failed to export to Excel", e);
        }
    }

    private byte[] hexToRgb(String hex) {
        if (hex == null || hex.isEmpty()) {
            return new byte[]{(byte)128, (byte)128, (byte)128}; // Default gray
        }
        if (hex.startsWith("#")) {
            hex = hex.substring(1);
        }
        try {
            return new byte[]{
                    (byte) Integer.parseInt(hex.substring(0, 2), 16),
                    (byte) Integer.parseInt(hex.substring(2, 4), 16),
                    (byte) Integer.parseInt(hex.substring(4, 6), 16)
            };
        } catch (Exception e) {
            return new byte[]{(byte)128, (byte)128, (byte)128}; // Default gray on error
        }
    }

    private Double[] getThresholdValues(KeyResultDTO kr, int numLevels) {
        // Handle null thresholds
        var thresholds = kr.getThresholds();
        if (thresholds == null) {
            Double[] defaults = new Double[numLevels];
            for (int i = 0; i < numLevels; i++) {
                defaults[i] = 0.0;
            }
            return defaults;
        }

        // Map the 5 backend thresholds to dynamic number of levels
        Double[] backendThresholds = {
                thresholds.getBelow() != null ? thresholds.getBelow() : 0.0,
                thresholds.getMeets() != null ? thresholds.getMeets() : 0.0,
                thresholds.getGood() != null ? thresholds.getGood() : 0.0,
                thresholds.getVeryGood() != null ? thresholds.getVeryGood() : 0.0,
                thresholds.getExceptional() != null ? thresholds.getExceptional() : 0.0
        };

        Double[] result = new Double[numLevels];
        for (int i = 0; i < numLevels; i++) {
            // Map level index to backend threshold index
            int backendIdx = Math.min(i, 4);
            result[i] = backendThresholds[backendIdx];
        }
        return result;
    }

    private String createQualitativeScoreFormula(int rowNum, List<ScoreLevel> levels) {
        // Build nested IF for qualitative grades: A=highest, E=lowest
        StringBuilder sb = new StringBuilder();
        String[] grades = {"A", "B", "C", "D", "E"};
        int numLevels = levels.size();

        for (int i = numLevels - 1; i >= 0; i--) {
            int gradeIdx = Math.min(numLevels - 1 - i, grades.length - 1);
            String grade = grades[gradeIdx];
            double score = levels.get(i).getScoreValue();

            if (i == 0) {
                sb.append(score);
            } else {
                sb.insert(0, String.format("IF(F%d=\"%s\",%s,", rowNum, grade, score));
                sb.append(")");
            }
        }
        return sb.toString();
    }

    private String createQualitativeLevelFormula(int rowNum, List<ScoreLevel> levels) {
        StringBuilder sb = new StringBuilder();
        String[] grades = {"A", "B", "C", "D", "E"};
        int numLevels = levels.size();

        for (int i = numLevels - 1; i >= 0; i--) {
            int gradeIdx = Math.min(numLevels - 1 - i, grades.length - 1);
            String grade = grades[gradeIdx];
            String levelName = levels.get(i).getName();

            if (i == 0) {
                sb.append("\"").append(levelName).append("\"");
            } else {
                sb.insert(0, String.format("IF(F%d=\"%s\",\"%s\",", rowNum, grade, levelName));
                sb.append(")");
            }
        }
        return sb.toString();
    }

    private String createDynamicScoreFormula(int rowNum, String metricType, int numLevels, int thresholdStartCol, List<ScoreLevel> levels) {
        // F = Actual (column 6, 1-indexed = F)
        // Threshold columns start at thresholdStartCol (H, I, J, K, L, etc.)
        String actualCol = "F";

        StringBuilder formula = new StringBuilder("ROUND(");

        if ("LOWER_BETTER".equals(metricType)) {
            // For lower is better: smaller actual = better score
            // Start from highest level (best), work down
            for (int i = numLevels - 1; i >= 0; i--) {
                String thresholdCol = getColumnLetter(thresholdStartCol + i);
                double score = levels.get(i).getScoreValue();

                if (i == numLevels - 1) {
                    // Highest level (exceptional)
                    formula.append(String.format("IF(%s%d<=%s%d,%s,", actualCol, rowNum, thresholdCol, rowNum, score));
                } else if (i == 0) {
                    // Lowest level (below) - default
                    formula.append(String.format("%s", score));
                } else {
                    // Interpolation between levels
                    String nextThresholdCol = getColumnLetter(thresholdStartCol + i + 1);
                    double nextScore = levels.get(i + 1).getScoreValue();
                    double scoreDiff = nextScore - score;
                    formula.append(String.format("IF(%s%d<=%s%d,%s+(%s%d-%s%d)/MAX(%s%d-%s%d,0.001)*%s,",
                            actualCol, rowNum, thresholdCol, rowNum,
                            score, thresholdCol, rowNum, actualCol, rowNum,
                            thresholdCol, rowNum, nextThresholdCol, rowNum, scoreDiff));
                }
            }
        } else {
            // For higher is better: larger actual = better score
            for (int i = numLevels - 1; i >= 0; i--) {
                String thresholdCol = getColumnLetter(thresholdStartCol + i);
                double score = levels.get(i).getScoreValue();

                if (i == numLevels - 1) {
                    // Highest level (exceptional)
                    formula.append(String.format("IF(%s%d>=%s%d,%s,", actualCol, rowNum, thresholdCol, rowNum, score));
                } else if (i == 0) {
                    // Lowest level (below) - default
                    formula.append(String.format("%s", score));
                } else {
                    // Interpolation between levels
                    String nextThresholdCol = getColumnLetter(thresholdStartCol + i + 1);
                    double nextScore = levels.get(i + 1).getScoreValue();
                    double scoreDiff = nextScore - score;
                    formula.append(String.format("IF(%s%d>=%s%d,%s+(%s%d-%s%d)/MAX(%s%d-%s%d,0.001)*%s,",
                            actualCol, rowNum, thresholdCol, rowNum,
                            score, actualCol, rowNum, thresholdCol, rowNum,
                            nextThresholdCol, rowNum, thresholdCol, rowNum, scoreDiff));
                }
            }
        }

        // Close all IFs
        for (int i = 0; i < numLevels - 1; i++) {
            formula.append(")");
        }
        formula.append(",2)"); // Round to 2 decimal places

        return formula.toString();
    }

    private String createDynamicLevelFormula(int rowNum, int scoreCol, List<ScoreLevel> levels) {
        String scoreColLetter = getColumnLetter(scoreCol);
        StringBuilder formula = new StringBuilder();

        // Build nested IF from highest to lowest
        for (int i = levels.size() - 1; i >= 0; i--) {
            double scoreValue = levels.get(i).getScoreValue();
            String levelName = levels.get(i).getName();

            if (i == 0) {
                formula.append("\"").append(levelName).append("\"");
            } else {
                formula.insert(0, String.format("IF(%s%d>=%s,\"%s\",", scoreColLetter, rowNum, scoreValue, levelName));
                formula.append(")");
            }
        }

        return formula.toString();
    }

    private String getColumnLetter(int colIndex) {
        StringBuilder sb = new StringBuilder();
        while (colIndex >= 0) {
            sb.insert(0, (char) ('A' + (colIndex % 26)));
            colIndex = colIndex / 26 - 1;
        }
        return sb.toString();
    }

    private void addDynamicScoreConditionalFormatting(XSSFSheet sheet, int lastRow, int scoreCol, int levelCol, List<ScoreLevel> levels) {
        XSSFSheetConditionalFormatting sheetCF = sheet.getSheetConditionalFormatting();
        String scoreColLetter = getColumnLetter(scoreCol);

        CellRangeAddress[] scoreRange = new CellRangeAddress[] {
                new CellRangeAddress(1, lastRow, scoreCol, scoreCol)
        };
        CellRangeAddress[] levelRange = new CellRangeAddress[] {
                new CellRangeAddress(1, lastRow, levelCol, levelCol)
        };

        // Create rules for each level (from highest to lowest for correct precedence)
        for (int i = levels.size() - 1; i >= 0; i--) {
            ScoreLevel level = levels.get(i);
            double scoreValue = level.getScoreValue();
            byte[] rgb = hexToRgb(level.getColor());

            String condition;
            if (i == levels.size() - 1) {
                // Highest level: >= its score
                condition = String.format("$%s2>=%s", scoreColLetter, scoreValue);
            } else {
                // Other levels: >= its score AND < next level's score
                double nextScore = levels.get(i + 1).getScoreValue();
                condition = String.format("AND($%s2>=%s,$%s2<%s)", scoreColLetter, scoreValue, scoreColLetter, nextScore);
            }

            ConditionalFormattingRule rule = sheetCF.createConditionalFormattingRule(condition);
            PatternFormatting pf = rule.createPatternFormatting();
            pf.setFillBackgroundColor(new XSSFColor(rgb, null));
            pf.setFillPattern(PatternFormatting.SOLID_FOREGROUND);
            FontFormatting ff = rule.createFontFormatting();
            ff.setFontColorIndex(IndexedColors.WHITE.getIndex());

            sheetCF.addConditionalFormatting(scoreRange, rule);
            sheetCF.addConditionalFormatting(levelRange, rule);
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createCenteredStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createThresholdStyle(Workbook workbook, byte[] rgb) {
        XSSFCellStyle style = (XSSFCellStyle) workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(rgb, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setTopBorderColor(IndexedColors.WHITE.getIndex());
        style.setBottomBorderColor(IndexedColors.WHITE.getIndex());
        style.setLeftBorderColor(IndexedColors.WHITE.getIndex());
        style.setRightBorderColor(IndexedColors.WHITE.getIndex());
        return style;
    }

    private String getMetricTypeDisplay(String metricType) {
        if (metricType == null) {
            return "";
        }
        switch (metricType) {
            case "HIGHER_BETTER":
                return "Чем выше, тем лучше";
            case "LOWER_BETTER":
                return "Чем ниже, тем лучше";
            case "QUALITATIVE":
                return "Качественный (A-E)";
            default:
                return metricType;
        }
    }
}
