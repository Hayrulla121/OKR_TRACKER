package com.example.objectkeyresulttracker.service;



import com.example.objectkeyresulttracker.dto.DepartmentDTO;
import com.example.objectkeyresulttracker.dto.KeyResultDTO;
import com.example.objectkeyresulttracker.dto.ObjectiveDTO;
import com.example.objectkeyresulttracker.dto.ThresholdDTO;
import com.example.objectkeyresulttracker.entity.Department;
import com.example.objectkeyresulttracker.entity.KeyResult;
import com.example.objectkeyresulttracker.entity.Objective;
import com.example.objectkeyresulttracker.repository.DepartmentRepository;
import com.example.objectkeyresulttracker.repository.KeyResultRepository;
import com.example.objectkeyresulttracker.repository.ObjectiveRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OkrService {

    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private ObjectiveRepository objectiveRepository;
    @Autowired
    private KeyResultRepository keyResultRepository;
    @Autowired
    private ScoreCalculationService scoreService;
    @PersistenceContext
    private EntityManager entityManager;

    // ==================== DEPARTMENTS ====================

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        try {
            return departmentRepository.findAll().stream()
                    .map(this::toDepartmentDTO)
                    .collect(Collectors.toList());
        } finally {
            scoreService.clearCache();
        }
    }

    @Transactional(readOnly = true)
    public DepartmentDTO getDepartment(String id) {
        try {
            return departmentRepository.findById(id)
                    .map(this::toDepartmentDTO)
                    .orElseThrow(() -> new RuntimeException("Department not found: " + id));
        } finally {
            scoreService.clearCache();
        }
    }

    @Transactional
    public DepartmentDTO createDepartment(DepartmentDTO dto) {
        Department dept = Department.builder()
                .name(dto.getName())
                .build();
        return toDepartmentDTO(departmentRepository.save(dept));
    }

    @Transactional
    public DepartmentDTO updateDepartment(String id, DepartmentDTO dto) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found: " + id));
        dept.setName(dto.getName());
        return toDepartmentDTO(departmentRepository.save(dept));
    }

    @Transactional
    public void deleteDepartment(String id) {
        departmentRepository.deleteById(id);
    }

    // ==================== OBJECTIVES ====================

    @Transactional
    public ObjectiveDTO createObjective(String departmentId, ObjectiveDTO dto) {
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        Objective obj = Objective.builder()
                .name(dto.getName())
                .weight(dto.getWeight())
                .department(dept)
                .build();

        return toObjectiveDTO(objectiveRepository.save(obj));
    }

    @Transactional
    public ObjectiveDTO updateObjective(String id, ObjectiveDTO dto) {
        Objective obj = objectiveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Objective not found"));
        obj.setName(dto.getName());
        obj.setWeight(dto.getWeight());
        return toObjectiveDTO(objectiveRepository.save(obj));
    }

    @Transactional
    public void deleteObjective(String id) {
        objectiveRepository.deleteById(id);
    }

    // ==================== KEY RESULTS ====================

    @Transactional
    public KeyResultDTO createKeyResult(String objectiveId, KeyResultDTO dto) {
        Objective obj = objectiveRepository.findById(objectiveId)
                .orElseThrow(() -> new RuntimeException("Objective not found"));

        KeyResult kr = KeyResult.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .metricType(dto.getMetricType())
                .unit(dto.getUnit())
                .weight(dto.getWeight())
                .thresholdBelow(dto.getThresholds().getBelow())
                .thresholdMeets(dto.getThresholds().getMeets())
                .thresholdGood(dto.getThresholds().getGood())
                .thresholdVeryGood(dto.getThresholds().getVeryGood())
                .thresholdExceptional(dto.getThresholds().getExceptional())
                .actualValue(dto.getActualValue())
                .objective(obj)
                .build();

        return toKeyResultDTO(keyResultRepository.save(kr));
    }

    @Transactional
    public KeyResultDTO updateKeyResult(String id, KeyResultDTO dto) {
        KeyResult kr = keyResultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Key Result not found"));

        kr.setName(dto.getName());
        kr.setDescription(dto.getDescription());
        kr.setActualValue(dto.getActualValue());
        kr.setWeight(dto.getWeight());

        if (dto.getThresholds() != null) {
            kr.setThresholdBelow(dto.getThresholds().getBelow());
            kr.setThresholdMeets(dto.getThresholds().getMeets());
            kr.setThresholdGood(dto.getThresholds().getGood());
            kr.setThresholdVeryGood(dto.getThresholds().getVeryGood());
            kr.setThresholdExceptional(dto.getThresholds().getExceptional());
        }

        return toKeyResultDTO(keyResultRepository.save(kr));
    }

    @Transactional
    public KeyResultDTO updateKeyResultActualValue(String id, String actualValue) {
        KeyResult kr = keyResultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Key Result not found"));
        kr.setActualValue(actualValue);
        return toKeyResultDTO(keyResultRepository.save(kr));
    }

    @Transactional
    public void deleteKeyResult(String id) {
        keyResultRepository.deleteById(id);
    }

    // ==================== DTO MAPPERS ====================

    private DepartmentDTO toDepartmentDTO(Department dept) {
        List<ObjectiveDTO> objectives = dept.getObjectives().stream()
                .map(this::toObjectiveDTO)
                .collect(Collectors.toList());

        return DepartmentDTO.builder()
                .id(dept.getId())
                .name(dept.getName())
                .objectives(objectives)
                .score(scoreService.calculateDepartmentScore(dept.getObjectives()))
                .build();
    }

    private ObjectiveDTO toObjectiveDTO(Objective obj) {
        List<KeyResultDTO> keyResults = obj.getKeyResults().stream()
                .map(this::toKeyResultDTO)
                .collect(Collectors.toList());

        return ObjectiveDTO.builder()
                .id(obj.getId())
                .name(obj.getName())
                .weight(obj.getWeight())
                .departmentId(obj.getDepartment().getId())
                .keyResults(keyResults)
                .score(scoreService.calculateObjectiveScore(obj.getKeyResults()))
                .build();
    }

    private KeyResultDTO toKeyResultDTO(KeyResult kr) {
        return KeyResultDTO.builder()
                .id(kr.getId())
                .name(kr.getName())
                .description(kr.getDescription())
                .metricType(kr.getMetricType())
                .unit(kr.getUnit())
                .weight(kr.getWeight())
                .thresholds(ThresholdDTO.builder()
                        .below(kr.getThresholdBelow())
                        .meets(kr.getThresholdMeets())
                        .good(kr.getThresholdGood())
                        .veryGood(kr.getThresholdVeryGood())
                        .exceptional(kr.getThresholdExceptional())
                        .build())
                .actualValue(kr.getActualValue())
                .objectiveId(kr.getObjective().getId())
                .score(scoreService.calculateKeyResultScore(kr))
                .build();
    }

    @Transactional
    public List<DepartmentDTO> loadDemoData() {
        try {
            // Clear existing data
            departmentRepository.deleteAll();

            // Create PMO department with demo objectives
            Department pmoDept = new Department();
            pmoDept.setName("PMO - Project Management Office");
            pmoDept = departmentRepository.save(pmoDept);

        // Цель 1: Обеспечить своевременную реализацию проектов (20%)
        createDemoObjective(pmoDept, "Цель 1: Обеспечить своевременную реализацию проектов", 20,
                new DemoKR[]{
                        new DemoKR("KR1.1 Проекты завершенные в срок (% от кол-ва проектов)", KeyResult.MetricType.HIGHER_BETTER, "%", 40, 50.0, 60.0, 80.0, 100.0, 120.0, "0"),
                        new DemoKR("KR1.2 Задачи в JIRA, завершенные в срок (%)", KeyResult.MetricType.HIGHER_BETTER, "%", 35, 50.0, 65.0, 95.0, 100.0, 200.0, "0"),
                        new DemoKR("KR1.3 Переносы сроков заверш задач в JIRA (% от общего кол-ва)", KeyResult.MetricType.LOWER_BETTER, "%", 25, 30.0, 20.0, 15.0, 5.0, 0.0, "0")
                });

        // Цель 2: Управление рисками и бюджетом проектов (20%)
        createDemoObjective(pmoDept, "Цель 2: Управление рисками и бюджетом проектов", 20,
                new DemoKR[]{
                        new DemoKR("KR2.1 Проекты в рамках бюджетов (% без превышения)", KeyResult.MetricType.HIGHER_BETTER, "%", 30, 50.0, 60.0, 75.0, 90.0, 100.0, "0"),
                        new DemoKR("KR2.2 Неучтенные риски возникшие после начала проекта (кол-во)", KeyResult.MetricType.LOWER_BETTER, "", 25, 10.0, 5.0, 2.0, 1.0, 0.0, "0"),
                        new DemoKR("KR2.3 Повысить точность оценки трудозатрат до 75%", KeyResult.MetricType.HIGHER_BETTER, "%", 25, 50.0, 75.0, 80.0, 85.0, 100.0, "0"),
                        new DemoKR("KR2.4 Процент рисков с планами митигации (%)", KeyResult.MetricType.HIGHER_BETTER, "%", 20, 20.0, 50.0, 60.0, 80.0, 100.0, "0")
                });

        // Цель 3: Управление качеством и отчетность (20%)
        createDemoObjective(pmoDept, "Цель 3: Управление качеством и отчетность", 20,
                new DemoKR[]{
                        new DemoKR("KR3.1 Своевременность отчетов W,Q,Y, другие (задержка, дней)", KeyResult.MetricType.LOWER_BETTER, " дней", 25, 5.0, 3.0, 2.0, 1.0, 0.0, "0"),
                        new DemoKR("KR3.2 Уровень использования ресурсов (resource utilization) %", KeyResult.MetricType.HIGHER_BETTER, "%", 25, 75.0, 85.0, 90.0, 95.0, 100.0, "0"),
                        new DemoKR("KR3.3 Реагирование на изменения (Response time to changes) часы", KeyResult.MetricType.LOWER_BETTER, " часов", 25, 5.0, 3.0, 2.0, 1.0, 0.0, "0"),
                        new DemoKR("KR3.4 Среднее время от инициации до завершения проекта (нед)", KeyResult.MetricType.LOWER_BETTER, " нед", 25, 10.0, 8.0, 6.0, 5.0, 4.0, "0")
                });

        // Цель 4: Усиление состава и человеческий капитал (10%) - includes qualitative KR
        createDemoObjective(pmoDept, "Цель 4: Усиление состава и человеческий капитал", 10,
                new DemoKR[]{
                        new DemoKR("KR4.1 Комплектация штата (6 свободных вакансий в штате)", KeyResult.MetricType.HIGHER_BETTER, "", 35, 2.0, 3.0, 4.0, 5.0, 6.0, "0"),
                        new DemoKR("KR4.2 Набор и подготовка стажеров (16 вакансий)", KeyResult.MetricType.HIGHER_BETTER, "", 35, 3.0, 6.0, 10.0, 12.0, 16.0, "0"),
                        new DemoKR("KR4.3 Качество развития сотрудников (оценка)", KeyResult.MetricType.QUALITATIVE, "", 30, 0.0, 0.0, 0.0, 0.0, 0.0, "C", "Качественная оценка программы развития сотрудников. A=Отлично, B=Очень хорошо, C=Хорошо, D=Удовлетворительно, E=Неудовлетворительно")
                });

        // Цель 5: Улучшение продуктов (10%)
        createDemoObjective(pmoDept, "Цель 5: Улучшение продуктов", 10,
                new DemoKR[]{
                        new DemoKR("KR5.1 Увеличить долю проектов, связанных со стратегическими целями Банка, до 85%", KeyResult.MetricType.HIGHER_BETTER, "%", 30, 75.0, 85.0, 90.0, 95.0, 100.0, "0"),
                        new DemoKR("KR5.2 % продуктов с повторными багами (Defect/error rate)", KeyResult.MetricType.LOWER_BETTER, "%", 30, 20.0, 15.0, 10.0, 5.0, 0.0, "0"),
                        new DemoKR("KR5.3 Обеспечить участие 100% членов команды в обучении по Agile/Scrum", KeyResult.MetricType.HIGHER_BETTER, "%", 20, 80.0, 90.0, 95.0, 100.0, 100.0, "0"),
                        new DemoKR("KR5.4 Провести 6 внутренних воркшопов по методологиям и новым технологиям", KeyResult.MetricType.HIGHER_BETTER, "", 20, 4.0, 6.0, 7.0, 8.0, 9.0, "0")
                });

        // Цель 6: Системная и бизнес аналитика и ее автоматизация (20%)
        createDemoObjective(pmoDept, "Цель 6: Системная и бизнес аналитика и ее автоматизация", 20,
                new DemoKR[]{
                        new DemoKR("KR6.1 Уровень автоматизации процессов проектного управления", KeyResult.MetricType.HIGHER_BETTER, "%", 40, 75.0, 85.0, 90.0, 95.0, 100.0, "0"),
                        new DemoKR("KR6.2 Качество описание бизнес процессов (изменение BPMN) %", KeyResult.MetricType.LOWER_BETTER, "%", 30, 20.0, 15.0, 10.0, 5.0, 0.0, "0"),
                        new DemoKR("KR6.3 Процент изменений плана проекта после планирования", KeyResult.MetricType.LOWER_BETTER, "%", 30, 20.0, 15.0, 10.0, 5.0, 0.0, "0")
                });

            // Flush to ensure all data is persisted before fetching
            entityManager.flush();
            entityManager.clear(); // Clear the persistence context to force a fresh fetch

            return getAllDepartments();
        } finally {
            scoreService.clearCache();
        }
    }

    private void createDemoObjective(Department dept, String name, Integer weight, DemoKR[] krs) {
        Objective objective = new Objective();
        objective.setName(name);
        objective.setWeight(weight);
        objective.setDepartment(dept);
        objective = objectiveRepository.save(objective);

        for (DemoKR kr : krs) {
            KeyResult keyResult = new KeyResult();
            keyResult.setName(kr.name);
            keyResult.setMetricType(kr.type);
            keyResult.setUnit(kr.unit);
            keyResult.setWeight(kr.weight);
            keyResult.setThresholdBelow(kr.below);
            keyResult.setThresholdMeets(kr.meets);
            keyResult.setThresholdGood(kr.good);
            keyResult.setThresholdVeryGood(kr.veryGood);
            keyResult.setThresholdExceptional(kr.exceptional);
            keyResult.setActualValue(kr.actualValue);
            keyResult.setDescription(kr.description);
            keyResult.setObjective(objective);
            keyResultRepository.save(keyResult);
        }
    }

    private static class DemoKR {
        String name;
        KeyResult.MetricType type;
        String unit;
        Integer weight;
        Double below, meets, good, veryGood, exceptional;
        String actualValue;
        String description;

        DemoKR(String name, KeyResult.MetricType type, String unit, Integer weight,
               Double below, Double meets, Double good, Double veryGood, Double exceptional,
               String actualValue) {
            this.name = name;
            this.type = type;
            this.unit = unit;
            this.weight = weight;
            this.below = below;
            this.meets = meets;
            this.good = good;
            this.veryGood = veryGood;
            this.exceptional = exceptional;
            this.actualValue = actualValue;
            this.description = "";
        }

        DemoKR(String name, KeyResult.MetricType type, String unit, Integer weight,
               Double below, Double meets, Double good, Double veryGood, Double exceptional,
               String actualValue, String description) {
            this(name, type, unit, weight, below, meets, good, veryGood, exceptional, actualValue);
            this.description = description;
        }
    }
}
