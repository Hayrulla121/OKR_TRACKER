package com.example.objectkeyresulttracker.service;



import com.example.objectkeyresulttracker.dto.DepartmentDTO;
import com.example.objectkeyresulttracker.dto.DepartmentScoreResult;
import com.example.objectkeyresulttracker.dto.KeyResultDTO;
import com.example.objectkeyresulttracker.dto.ObjectiveDTO;
import com.example.objectkeyresulttracker.dto.ScoreResult;
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
    @Autowired
    private com.example.objectkeyresulttracker.repository.UserRepository userRepository;
    @Autowired
    private com.example.objectkeyresulttracker.repository.EvaluationRepository evaluationRepository;
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
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
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found: " + id));

        // 1. Delete all evaluations for this department
        try {
            UUID deptUuid = UUID.fromString(id);
            var evaluations = evaluationRepository.findByTargetTypeAndTargetId("DEPARTMENT", deptUuid);
            evaluationRepository.deleteAll(evaluations);
        } catch (IllegalArgumentException e) {
            // ID is not a valid UUID, skip evaluation cleanup
        }

        // 2. Unassign all users from this department (set department to null)
        var usersInDept = userRepository.findByDepartment(dept);
        for (var user : usersInDept) {
            user.setDepartment(null);
            userRepository.save(user);
        }

        // 3. Clear departmentLeader reference if set
        if (dept.getDepartmentLeader() != null) {
            dept.setDepartmentLeader(null);
            departmentRepository.save(dept);
        }

        // 4. Now delete the department (objectives will be cascade deleted)
        departmentRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public com.example.objectkeyresulttracker.dto.DepartmentScoreResult getDepartmentScoreWithEvaluations(String id) {
        try {
            Department dept = departmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Department not found: " + id));
            return scoreService.calculateDepartmentScoreWithEvaluations(id, dept.getObjectives());
        } finally {
            scoreService.clearCache();
        }
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

        // Get automatic OKR score
        ScoreResult okrScore = scoreService.calculateDepartmentScore(dept.getObjectives());

        // Get full evaluation result including final combined score
        DepartmentScoreResult evalResult = scoreService.calculateDepartmentScoreWithEvaluations(dept.getId(), dept.getObjectives());

        // Create final score result if all evaluations are present
        ScoreResult finalScore = null;
        if (evalResult.getFinalCombinedScore() != null) {
            finalScore = ScoreResult.builder()
                    .score(evalResult.getFinalCombinedScore())
                    .level(evalResult.getScoreLevel())
                    .color(evalResult.getColor())
                    .percentage(evalResult.getFinalPercentage())
                    .build();
        }

        boolean hasAllEvaluations = evalResult.getHasDirectorEvaluation() && evalResult.getHasHrEvaluation();

        return DepartmentDTO.builder()
                .id(dept.getId())
                .name(dept.getName())
                .objectives(objectives)
                .score(okrScore)
                .finalScore(finalScore)
                .hasAllEvaluations(hasAllEvaluations)
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
            System.out.println("Loading demo data...");

            // Clear existing data in correct order to respect foreign key constraints:
            // 1. First delete evaluations (no dependencies)
            evaluationRepository.deleteAll();
            System.out.println("  - Cleared evaluations");

            // 2. Unassign all users from departments (to break FK constraint)
            var allUsers = userRepository.findAll();
            for (var user : allUsers) {
                user.setDepartment(null);
            }
            userRepository.saveAll(allUsers);
            System.out.println("  - Unassigned users from departments");

            // 3. Clear department leaders (to break FK constraint)
            var allDepts = departmentRepository.findAll();
            for (var dept : allDepts) {
                dept.setDepartmentLeader(null);
            }
            departmentRepository.saveAll(allDepts);
            System.out.println("  - Cleared department leaders");

            // 4. Now we can safely delete departments (objectives cascade delete automatically)
            departmentRepository.deleteAll();
            System.out.println("  - Deleted all departments and objectives");

            // 5. Finally delete users
            userRepository.deleteAll();
            System.out.println("  - Deleted all users");

            // Flush deletes before creating new data
            entityManager.flush();

            // Create PMO department with demo objectives
            Department pmoDept = new Department();
            pmoDept.setName("PMO - Project Management Office");
            pmoDept = departmentRepository.save(pmoDept);

            // ==================== CREATE DEMO USERS ====================

            // 1. Create Admin user
            com.example.objectkeyresulttracker.entity.User admin = com.example.objectkeyresulttracker.entity.User.builder()
                    .username("admin")
                    .email("admin@okr-tracker.com")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("System Administrator")
                    .role(com.example.objectkeyresulttracker.entity.Role.ADMIN)
                    .build();
            admin = userRepository.save(admin);

            // 2. Create Director user
            com.example.objectkeyresulttracker.entity.User director = com.example.objectkeyresulttracker.entity.User.builder()
                    .username("director")
                    .email("director@okr-tracker.com")
                    .password(passwordEncoder.encode("director123"))
                    .fullName("Алишер Каримов")
                    .role(com.example.objectkeyresulttracker.entity.Role.DIRECTOR)
                    .build();
            director = userRepository.save(director);

            // 3. Create HR user
            com.example.objectkeyresulttracker.entity.User hr = com.example.objectkeyresulttracker.entity.User.builder()
                    .username("hr")
                    .email("hr@okr-tracker.com")
                    .password(passwordEncoder.encode("hr123"))
                    .fullName("Гульнора Азимова")
                    .role(com.example.objectkeyresulttracker.entity.Role.HR)
                    .build();
            hr = userRepository.save(hr);

            // 4. Create Business Block user
            com.example.objectkeyresulttracker.entity.User businessBlock = com.example.objectkeyresulttracker.entity.User.builder()
                    .username("business")
                    .email("business@okr-tracker.com")
                    .password(passwordEncoder.encode("business123"))
                    .fullName("Шерзод Рахимов")
                    .role(com.example.objectkeyresulttracker.entity.Role.BUSINESS_BLOCK)
                    .build();
            businessBlock = userRepository.save(businessBlock);

            // 5. Create Department Leader for PMO
            com.example.objectkeyresulttracker.entity.User deptLeader = com.example.objectkeyresulttracker.entity.User.builder()
                    .username("pmo_leader")
                    .email("pmo.leader@okr-tracker.com")
                    .password(passwordEncoder.encode("leader123"))
                    .fullName("Умида Усманова")
                    .role(com.example.objectkeyresulttracker.entity.Role.DEPARTMENT_LEADER)
                    .department(pmoDept)
                    .build();
            deptLeader = userRepository.save(deptLeader);

            // 6. Create Employee users
            com.example.objectkeyresulttracker.entity.User employee1 = com.example.objectkeyresulttracker.entity.User.builder()
                    .username("employee1")
                    .email("employee1@okr-tracker.com")
                    .password(passwordEncoder.encode("employee123"))
                    .fullName("Бахром Иброхимов")
                    .role(com.example.objectkeyresulttracker.entity.Role.EMPLOYEE)
                    .department(pmoDept)
                    .build();
            employee1 = userRepository.save(employee1);

            com.example.objectkeyresulttracker.entity.User employee2 = com.example.objectkeyresulttracker.entity.User.builder()
                    .username("employee2")
                    .email("employee2@okr-tracker.com")
                    .password(passwordEncoder.encode("employee123"))
                    .fullName("Дилноза Турсунова")
                    .role(com.example.objectkeyresulttracker.entity.Role.EMPLOYEE)
                    .department(pmoDept)
                    .build();
            employee2 = userRepository.save(employee2);

            // Link department leader to PMO department
            pmoDept.setDepartmentLeader(deptLeader);
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

            // ==================== DEMO EVALUATIONS REMOVED ====================
            // Evaluations are not pre-created so users can test the evaluation flow themselves
            // Login as director/hr/business to submit evaluations

            // Flush to ensure all data is persisted before fetching
            entityManager.flush();
            entityManager.clear(); // Clear the persistence context to force a fresh fetch

            System.out.println("=".repeat(80));
            System.out.println("DEMO DATA LOADED SUCCESSFULLY!");
            System.out.println("=".repeat(80));
            System.out.println("\nDemo Users Created:");
            System.out.println("  1. Admin:          username='admin'      password='admin123'");
            System.out.println("  2. Director:       username='director'   password='director123'");
            System.out.println("  3. HR:             username='hr'         password='hr123'");
            System.out.println("  4. Business Block: username='business'   password='business123'");
            System.out.println("  5. Dept Leader:    username='pmo_leader' password='leader123'");
            System.out.println("  6. Employee 1:     username='employee1'  password='employee123'");
            System.out.println("  7. Employee 2:     username='employee2'  password='employee123'");
            System.out.println("\nEvaluations:");
            System.out.println("  - No pre-filled evaluations - login as director/hr/business to evaluate");
            System.out.println("\nDepartment Score Calculation:");
            System.out.println("  - Automatic OKR Score: Will be calculated from Key Results");
            System.out.println("  - Final Score: (Auto × 60%) + (Director × 20%) + (HR × 20%)");
            System.out.println("=".repeat(80));

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
