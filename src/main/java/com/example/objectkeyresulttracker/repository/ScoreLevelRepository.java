package com.example.objectkeyresulttracker.repository;

import com.example.objectkeyresulttracker.entity.ScoreLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreLevelRepository extends JpaRepository<ScoreLevel, String> {
    List<ScoreLevel> findAllByOrderByDisplayOrderAsc();
}
