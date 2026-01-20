package com.example.objectkeyresulttracker.controller;


import com.example.objectkeyresulttracker.dto.DepartmentDTO;
import com.example.objectkeyresulttracker.dto.ObjectiveDTO;
import com.example.objectkeyresulttracker.dto.KeyResultDTO;
import com.example.objectkeyresulttracker.service.OkrService;
import com.example.objectkeyresulttracker.service.ExcelExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class OkrController {

    private final OkrService okrService;
    private final ExcelExportService excelExportService;

    // ==================== DEPARTMENTS ====================

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        return ResponseEntity.ok(okrService.getAllDepartments());
    }

    @GetMapping("/departments/{id}")
    public ResponseEntity<DepartmentDTO> getDepartment(@PathVariable String id) {
        return ResponseEntity.ok(okrService.getDepartment(id));
    }

    @PostMapping("/departments")
    public ResponseEntity<DepartmentDTO> createDepartment(@RequestBody DepartmentDTO dto) {
        return ResponseEntity.ok(okrService.createDepartment(dto));
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<DepartmentDTO> updateDepartment(
            @PathVariable String id, @RequestBody DepartmentDTO dto) {
        return ResponseEntity.ok(okrService.updateDepartment(id, dto));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable String id) {
        okrService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/departments/{id}/scores")
    public ResponseEntity<com.example.objectkeyresulttracker.dto.DepartmentScoreResult> getDepartmentScores(@PathVariable String id) {
        return ResponseEntity.ok(okrService.getDepartmentScoreWithEvaluations(id));
    }

    // ==================== OBJECTIVES ====================

    @PostMapping("/departments/{departmentId}/objectives")
    public ResponseEntity<ObjectiveDTO> createObjective(
            @PathVariable String departmentId, @RequestBody ObjectiveDTO dto) {
        return ResponseEntity.ok(okrService.createObjective(departmentId, dto));
    }

    @PutMapping("/objectives/{id}")
    public ResponseEntity<ObjectiveDTO> updateObjective(
            @PathVariable String id, @RequestBody ObjectiveDTO dto) {
        return ResponseEntity.ok(okrService.updateObjective(id, dto));
    }

    @DeleteMapping("/objectives/{id}")
    public ResponseEntity<Void> deleteObjective(@PathVariable String id) {
        okrService.deleteObjective(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== KEY RESULTS ====================

    @PostMapping("/objectives/{objectiveId}/key-results")
    public ResponseEntity<KeyResultDTO> createKeyResult(
            @PathVariable String objectiveId, @RequestBody KeyResultDTO dto) {
        return ResponseEntity.ok(okrService.createKeyResult(objectiveId, dto));
    }

    @PutMapping("/key-results/{id}")
    public ResponseEntity<KeyResultDTO> updateKeyResult(
            @PathVariable String id, @RequestBody KeyResultDTO dto) {
        return ResponseEntity.ok(okrService.updateKeyResult(id, dto));
    }

    @PutMapping("/key-results/{id}/actual-value")
    public ResponseEntity<KeyResultDTO> updateKeyResultActualValue(
            @PathVariable String id, @RequestBody java.util.Map<String, String> payload) {
        return ResponseEntity.ok(okrService.updateKeyResultActualValue(id, payload.get("actualValue")));
    }

    @DeleteMapping("/key-results/{id}")
    public ResponseEntity<Void> deleteKeyResult(@PathVariable String id) {
        okrService.deleteKeyResult(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== EXPORT ====================

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportToExcel() {
        byte[] excelData = excelExportService.exportToExcel(okrService.getAllDepartments());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "okr_export.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }

    // ==================== DEMO DATA ====================

    @PostMapping("/demo/load")
    public ResponseEntity<List<DepartmentDTO>> loadDemoData() {
        return ResponseEntity.ok(okrService.loadDemoData());
    }
}