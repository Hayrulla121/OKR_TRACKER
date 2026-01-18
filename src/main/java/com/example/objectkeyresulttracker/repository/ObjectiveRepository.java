package com.example.objectkeyresulttracker.repository;

import com.example.objectkeyresulttracker.entity.Objective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ObjectiveRepository extends JpaRepository<Objective, String> {
    List<Objective> findByDepartmentId(String departmentId);
}