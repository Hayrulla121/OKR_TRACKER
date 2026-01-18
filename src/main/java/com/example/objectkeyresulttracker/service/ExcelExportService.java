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
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ExcelExportService {

    private static final String[] HEADERS = {
            "Department", "Objective", "Objective Weight", "Key Result",
            "Type", "Actual", "Unit", "Below", "Meets", "Good",
            "Very Good", "Exceptional", "Score", "Performance Level"
    };

    public byte[] exportToExcel(List<DepartmentDTO> departments) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("OKR Export");

            // Create styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle weightStyle = createWeightStyle(workbook);
            CellStyle scoreStyle = createScoreStyle(workbook);
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
                cell.setCellStyle(i == 2 ? weightStyle : headerStyle);
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
                            row.createCell(0).setCellValue(dept.getName());
                        }

                        // Objective (only in first row of obj)
                        if (rowIdx == objStartRow) {
                            row.createCell(1).setCellValue(obj.getName());
                            Cell weightCell = row.createCell(2);
                            weightCell.setCellValue(obj.getWeight() + "%");
                            weightCell.setCellStyle(weightStyle);
                        }

                        // Key Result details
                        row.createCell(3).setCellValue(kr.getName());
                        row.createCell(4).setCellValue(getMetricTypeDisplay(kr.getMetricType() != null ? kr.getMetricType().name() : ""));
                        row.createCell(5).setCellValue(kr.getActualValue() != null ? kr.getActualValue() : "0");
                        row.createCell(6).setCellValue(kr.getUnit() != null ? kr.getUnit() : "");

                        // Thresholds
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
                        }

                        // Score and Performance Level
                        ScoreResult score = kr.getScore();
                        if (score != null) {
                            Cell scoreCell = row.createCell(12);
                            scoreCell.setCellValue(score.getScore());
                            scoreCell.setCellStyle(getScoreStyleForLevel(workbook, score.getLevel()));

                            Cell levelCell = row.createCell(13);
                            levelCell.setCellValue(getLevelLabel(score.getLevel()));
                            levelCell.setCellStyle(getScoreStyleForLevel(workbook, score.getLevel()));
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

            // Auto-size columns
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Failed to export to Excel", e);
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

    private CellStyle createWeightStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.DARK_YELLOW.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createScoreStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
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

    private CellStyle getScoreStyleForLevel(Workbook workbook, String level) {
        XSSFCellStyle style = (XSSFCellStyle) createScoreStyle(workbook);
        byte[] rgb;
        switch (level) {
            case "exceptional":
                rgb = new byte[]{(byte)30, (byte)123, (byte)52}; // #1e7b34
                break;
            case "very_good":
                rgb = new byte[]{(byte)40, (byte)167, (byte)69}; // #28a745
                break;
            case "good":
                rgb = new byte[]{(byte)92, (byte)184, (byte)92}; // #5cb85c
                break;
            case "meets":
                rgb = new byte[]{(byte)240, (byte)173, (byte)78}; // #f0ad4e
                break;
            default:
                rgb = new byte[]{(byte)220, (byte)53, (byte)69}; // #dc3545
        }
        style.setFillForegroundColor(new XSSFColor(rgb, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private String getMetricTypeDisplay(String metricType) {
        if (metricType == null) {
            return "";
        }
        switch (metricType) {
            case "HIGHER_BETTER":
                return "↑ Higher Better";
            case "LOWER_BETTER":
                return "↓ Lower Better";
            case "QUALITATIVE":
                return "Qualitative (A-E)";
            default:
                return metricType;
        }
    }

    private String getLevelLabel(String level) {
        switch (level) {
            case "exceptional":
                return "Exceptional";
            case "very_good":
                return "Very Good";
            case "good":
                return "Good";
            case "meets":
                return "Meets";
            default:
                return "Below";
        }
    }
}
