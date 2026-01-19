package com.example.objectkeyresulttracker.service;

import com.example.objectkeyresulttracker.dto.DepartmentDTO;
import com.example.objectkeyresulttracker.dto.KeyResultDTO;
import com.example.objectkeyresulttracker.dto.ObjectiveDTO;
import com.example.objectkeyresulttracker.dto.ScoreResult;
import com.example.objectkeyresulttracker.entity.KeyResult.MetricType;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFFormulaEvaluator;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFConditionalFormattingRule;
import org.apache.poi.xssf.usermodel.XSSFSheetConditionalFormatting;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ExcelExportService {

    private static final String[] HEADERS = {
            "Департамент", "Цель", "Вес цели", "Ключевой результат",
            "Тип", "Факт", "Единица измерения", "Ниже нормы", "Норма", "Хорошо",
            "Очень хорошо", "Исключительно", "Оценка", "Уровень исполнения"
    };

    public byte[] exportToExcel(List<DepartmentDTO> departments) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            XSSFSheet sheet = workbook.createSheet("Экспорт OKR");

            // Create styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle defaultCellStyle = createDefaultCellStyle(workbook);
            CellStyle centeredStyle = createCenteredStyle(workbook);
            CellStyle belowThresholdStyle = createThresholdStyle(workbook, new byte[]{(byte)220, (byte)53, (byte)69});
            CellStyle meetsThresholdStyle = createThresholdStyle(workbook, new byte[]{(byte)240, (byte)173, (byte)78});
            CellStyle goodThresholdStyle = createThresholdStyle(workbook, new byte[]{(byte)92, (byte)184, (byte)92});
            CellStyle veryGoodThresholdStyle = createThresholdStyle(workbook, new byte[]{(byte)40, (byte)167, (byte)69});
            CellStyle exceptionalThresholdStyle = createThresholdStyle(workbook, new byte[]{(byte)30, (byte)123, (byte)52});

            // Create header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Add data
            int rowIdx = 1;
            for (DepartmentDTO dept : departments) {
                int deptStartRow = rowIdx;

                for (ObjectiveDTO obj : dept.getObjectives()) {
                    int objStartRow = rowIdx;
                    List<KeyResultDTO> krs = obj.getKeyResults();

                    for (KeyResultDTO kr : krs) {
                        Row row = sheet.createRow(rowIdx);

                        // Department (only in first row of dept)
                        if (rowIdx == deptStartRow) {
                            Cell deptCell = row.createCell(0);
                            deptCell.setCellValue(dept.getName());
                            deptCell.setCellStyle(centeredStyle);
                        }

                        // Objective (only in first row of obj)
                        if (rowIdx == objStartRow) {
                            Cell objCell = row.createCell(1);
                            objCell.setCellValue(obj.getName());
                            objCell.setCellStyle(centeredStyle);

                            Cell weightCell = row.createCell(2);
                            weightCell.setCellValue(obj.getWeight() + "%");
                            weightCell.setCellStyle(centeredStyle);
                        }

                        // Key Result details
                        row.createCell(3).setCellValue(kr.getName());
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

                        // Thresholds as numbers for formulas
                        Cell belowCell, meetsCell, goodCell, veryGoodCell, exceptionalCell;
                        if (kr.getMetricType() == MetricType.QUALITATIVE) {
                            belowCell = row.createCell(7);
                            belowCell.setCellValue("E");
                            belowCell.setCellStyle(belowThresholdStyle);

                            meetsCell = row.createCell(8);
                            meetsCell.setCellValue("D");
                            meetsCell.setCellStyle(meetsThresholdStyle);

                            goodCell = row.createCell(9);
                            goodCell.setCellValue("C");
                            goodCell.setCellStyle(goodThresholdStyle);

                            veryGoodCell = row.createCell(10);
                            veryGoodCell.setCellValue("B");
                            veryGoodCell.setCellStyle(veryGoodThresholdStyle);

                            exceptionalCell = row.createCell(11);
                            exceptionalCell.setCellValue("A");
                            exceptionalCell.setCellStyle(exceptionalThresholdStyle);

                            // Score formula for qualitative
                            Cell scoreCell = row.createCell(12);
                            String qualFormula = String.format(
                                "IF(F%d=\"A\",5,IF(F%d=\"B\",4.75,IF(F%d=\"C\",4.5,IF(F%d=\"D\",4.25,3))))",
                                rowIdx + 1, rowIdx + 1, rowIdx + 1, rowIdx + 1
                            );
                            scoreCell.setCellFormula(qualFormula);

                            // Performance Level formula for qualitative
                            Cell levelCell = row.createCell(13);
                            String qualLevelFormula = String.format(
                                "IF(F%d=\"A\",\"Исключительно\",IF(F%d=\"B\",\"Очень хорошо\",IF(F%d=\"C\",\"Хорошо\",IF(F%d=\"D\",\"Норма\",\"Ниже нормы\"))))",
                                rowIdx + 1, rowIdx + 1, rowIdx + 1, rowIdx + 1
                            );
                            levelCell.setCellFormula(qualLevelFormula);
                        } else {
                            belowCell = row.createCell(7);
                            belowCell.setCellValue(kr.getThresholds().getBelow());
                            belowCell.setCellStyle(belowThresholdStyle);

                            meetsCell = row.createCell(8);
                            meetsCell.setCellValue(kr.getThresholds().getMeets());
                            meetsCell.setCellStyle(meetsThresholdStyle);

                            goodCell = row.createCell(9);
                            goodCell.setCellValue(kr.getThresholds().getGood());
                            goodCell.setCellStyle(goodThresholdStyle);

                            veryGoodCell = row.createCell(10);
                            veryGoodCell.setCellValue(kr.getThresholds().getVeryGood());
                            veryGoodCell.setCellStyle(veryGoodThresholdStyle);

                            exceptionalCell = row.createCell(11);
                            exceptionalCell.setCellValue(kr.getThresholds().getExceptional());
                            exceptionalCell.setCellStyle(exceptionalThresholdStyle);

                            // Score calculation formula
                            Cell scoreCell = row.createCell(12);
                            String metricType = kr.getMetricType() != null ? kr.getMetricType().name() : "HIGHER_BETTER";
                            String scoreFormula = createScoreFormula(rowIdx + 1, metricType);
                            scoreCell.setCellFormula(scoreFormula);

                            // Performance Level formula
                            Cell levelCell = row.createCell(13);
                            String levelFormula = String.format(
                                "IF(M%d>=5,\"Исключительно\",IF(M%d>=4.75,\"Очень хорошо\",IF(M%d>=4.5,\"Хорошо\",IF(M%d>=4.25,\"Норма\",\"Ниже нормы\"))))",
                                rowIdx + 1, rowIdx + 1, rowIdx + 1, rowIdx + 1
                            );
                            levelCell.setCellFormula(levelFormula);
                        }

                        rowIdx++;
                    }

                    // Merge objective cells if multiple KRs
                    if (krs.size() > 1) {
                        int objEndRow = rowIdx - 1;
                        sheet.addMergedRegion(new CellRangeAddress(objStartRow, objEndRow, 1, 1));
                        sheet.addMergedRegion(new CellRangeAddress(objStartRow, objEndRow, 2, 2));
                    }
                }

                // Merge department cells
                int deptEndRow = rowIdx - 1;
                if (deptEndRow > deptStartRow) {
                    sheet.addMergedRegion(new CellRangeAddress(deptStartRow, deptEndRow, 0, 0));
                }
            }

            // Add conditional formatting for Score column (M) - colors based on score value
            int lastDataRow = rowIdx - 1;
            if (lastDataRow > 0) {
                addScoreConditionalFormatting(sheet, lastDataRow);
            }

            // Auto-size columns
            for (int i = 0; i < HEADERS.length; i++) {
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

    private String createScoreFormula(int rowNum, String metricType) {
        // F = Actual, H = Below, I = Meets, J = Good, K = VeryGood, L = Exceptional
        if ("LOWER_BETTER".equals(metricType)) {
            // For lower is better: reverse the comparison logic
            return String.format(
                "ROUND(IF(F%d<=L%d,5," +
                "IF(F%d<=K%d,4.75+(L%d-F%d)/MAX(K%d-L%d,0.001)*0.25," +
                "IF(F%d<=J%d,4.5+(K%d-F%d)/MAX(J%d-K%d,0.001)*0.25," +
                "IF(F%d<=I%d,4.25+(J%d-F%d)/MAX(I%d-J%d,0.001)*0.25," +
                "IF(F%d<=H%d,3+(I%d-F%d)/MAX(H%d-I%d,0.001)*1.25,3))))),2)",
                rowNum, rowNum,
                rowNum, rowNum, rowNum, rowNum, rowNum, rowNum,
                rowNum, rowNum, rowNum, rowNum, rowNum, rowNum,
                rowNum, rowNum, rowNum, rowNum, rowNum, rowNum,
                rowNum, rowNum, rowNum, rowNum, rowNum, rowNum
            );
        } else {
            // For higher is better (default)
            return String.format(
                "ROUND(IF(F%d>=L%d,5," +
                "IF(F%d>=K%d,4.75+(F%d-K%d)/MAX(L%d-K%d,0.001)*0.25," +
                "IF(F%d>=J%d,4.5+(F%d-J%d)/MAX(K%d-J%d,0.001)*0.25," +
                "IF(F%d>=I%d,4.25+(F%d-I%d)/MAX(J%d-I%d,0.001)*0.25," +
                "IF(F%d>=H%d,3+(F%d-H%d)/MAX(I%d-H%d,0.001)*1.25,3))))),2)",
                rowNum, rowNum,
                rowNum, rowNum, rowNum, rowNum, rowNum, rowNum,
                rowNum, rowNum, rowNum, rowNum, rowNum, rowNum,
                rowNum, rowNum, rowNum, rowNum, rowNum, rowNum,
                rowNum, rowNum, rowNum, rowNum, rowNum, rowNum
            );
        }
    }

    private void addScoreConditionalFormatting(XSSFSheet sheet, int lastRow) {
        XSSFSheetConditionalFormatting sheetCF = sheet.getSheetConditionalFormatting();

        CellRangeAddress[] scoreRange = new CellRangeAddress[] {
            new CellRangeAddress(1, lastRow, 12, 12)  // Score column M
        };
        CellRangeAddress[] levelRange = new CellRangeAddress[] {
            new CellRangeAddress(1, lastRow, 13, 13)  // Performance Level column N
        };

        // Exceptional (>=5) - Dark Green
        ConditionalFormattingRule rule1 = sheetCF.createConditionalFormattingRule("$M2>=5");
        PatternFormatting pf1 = rule1.createPatternFormatting();
        pf1.setFillBackgroundColor(new XSSFColor(new byte[]{(byte)30, (byte)123, (byte)52}, null));
        pf1.setFillPattern(PatternFormatting.SOLID_FOREGROUND);
        FontFormatting ff1 = rule1.createFontFormatting();
        ff1.setFontColorIndex(IndexedColors.WHITE.getIndex());

        // Very Good (>=4.75) - Green
        ConditionalFormattingRule rule2 = sheetCF.createConditionalFormattingRule("AND($M2>=4.75,$M2<5)");
        PatternFormatting pf2 = rule2.createPatternFormatting();
        pf2.setFillBackgroundColor(new XSSFColor(new byte[]{(byte)40, (byte)167, (byte)69}, null));
        pf2.setFillPattern(PatternFormatting.SOLID_FOREGROUND);
        FontFormatting ff2 = rule2.createFontFormatting();
        ff2.setFontColorIndex(IndexedColors.WHITE.getIndex());

        // Good (>=4.5) - Light Green
        ConditionalFormattingRule rule3 = sheetCF.createConditionalFormattingRule("AND($M2>=4.5,$M2<4.75)");
        PatternFormatting pf3 = rule3.createPatternFormatting();
        pf3.setFillBackgroundColor(new XSSFColor(new byte[]{(byte)92, (byte)184, (byte)92}, null));
        pf3.setFillPattern(PatternFormatting.SOLID_FOREGROUND);
        FontFormatting ff3 = rule3.createFontFormatting();
        ff3.setFontColorIndex(IndexedColors.WHITE.getIndex());

        // Meets (>=4.25) - Orange
        ConditionalFormattingRule rule4 = sheetCF.createConditionalFormattingRule("AND($M2>=4.25,$M2<4.5)");
        PatternFormatting pf4 = rule4.createPatternFormatting();
        pf4.setFillBackgroundColor(new XSSFColor(new byte[]{(byte)240, (byte)173, (byte)78}, null));
        pf4.setFillPattern(PatternFormatting.SOLID_FOREGROUND);
        FontFormatting ff4 = rule4.createFontFormatting();
        ff4.setFontColorIndex(IndexedColors.WHITE.getIndex());

        // Below (<4.25) - Red
        ConditionalFormattingRule rule5 = sheetCF.createConditionalFormattingRule("$M2<4.25");
        PatternFormatting pf5 = rule5.createPatternFormatting();
        pf5.setFillBackgroundColor(new XSSFColor(new byte[]{(byte)220, (byte)53, (byte)69}, null));
        pf5.setFillPattern(PatternFormatting.SOLID_FOREGROUND);
        FontFormatting ff5 = rule5.createFontFormatting();
        ff5.setFontColorIndex(IndexedColors.WHITE.getIndex());

        // Apply to score column
        sheetCF.addConditionalFormatting(scoreRange, rule1);
        sheetCF.addConditionalFormatting(scoreRange, rule2);
        sheetCF.addConditionalFormatting(scoreRange, rule3);
        sheetCF.addConditionalFormatting(scoreRange, rule4);
        sheetCF.addConditionalFormatting(scoreRange, rule5);

        // Apply same rules to level column
        sheetCF.addConditionalFormatting(levelRange, rule1);
        sheetCF.addConditionalFormatting(levelRange, rule2);
        sheetCF.addConditionalFormatting(levelRange, rule3);
        sheetCF.addConditionalFormatting(levelRange, rule4);
        sheetCF.addConditionalFormatting(levelRange, rule5);
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

    private CellStyle createDefaultCellStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.LEFT);
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
