package com.example.objectkeyresulttracker.repository;


import com.example.objectkeyresulttracker.entity.KeyResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KeyResultRepository extends JpaRepository<KeyResult, String> {
    List<KeyResult> findByObjectiveId(String objectiveId);
}