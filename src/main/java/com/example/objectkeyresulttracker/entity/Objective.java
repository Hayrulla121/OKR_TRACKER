package com.example.objectkeyresulttracker.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Table(name = "objectives")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Objective {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer weight; // Percentage weight within department (0-100)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @OneToMany(mappedBy = "objective", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<KeyResult> keyResults = new ArrayList<>();
}
