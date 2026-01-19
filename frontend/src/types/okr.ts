export interface ScoreResult {
    score: number;
    level: string; // Dynamic level name from score levels configuration
    color: string;
    percentage: number;
}

export interface Threshold {
    below: number;
    meets: number;
    good: number;
    veryGood: number;
    exceptional: number;
}

export type MetricType = 'HIGHER_BETTER' | 'LOWER_BETTER' | 'QUALITATIVE';

export interface KeyResult {
    id: string;
    name: string;
    description?: string;
    metricType: MetricType;
    unit?: string;
    weight: number;
    thresholds: Threshold;
    actualValue: string;
    objectiveId: string;
    score?: ScoreResult;
}

export interface Objective {
    id: string;
    name: string;
    weight: number;
    departmentId: string;
    keyResults: KeyResult[];
    score?: ScoreResult;
}

export interface Department {
    id: string;
    name: string;
    objectives: Objective[];
    score?: ScoreResult;
}

export interface ScoreLevel {
    id?: string;
    name: string;
    scoreValue: number;
    color: string;
    displayOrder: number;
}