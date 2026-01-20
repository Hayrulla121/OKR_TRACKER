import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ScoreLevel } from '../types/okr';
import { scoreLevelApi } from '../services/api';

interface ScoreLevelContextType {
    scoreLevels: ScoreLevel[];
    loading: boolean;
    error: string | null;
    refreshScoreLevels: () => Promise<void>;
}

const ScoreLevelContext = createContext<ScoreLevelContextType | undefined>(undefined);

const DEFAULT_SCORE_LEVELS: ScoreLevel[] = [
    { name: 'Below', scoreValue: 3.0, color: '#dc3545', displayOrder: 0 },
    { name: 'Meets', scoreValue: 4.25, color: '#ffc107', displayOrder: 1 },
    { name: 'Good', scoreValue: 4.5, color: '#5cb85c', displayOrder: 2 },
    { name: 'Very Good', scoreValue: 4.75, color: '#28a745', displayOrder: 3 },
    { name: 'Exceptional', scoreValue: 5.0, color: '#1e7b34', displayOrder: 4 },
];

export const ScoreLevelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [scoreLevels, setScoreLevels] = useState<ScoreLevel[]>(DEFAULT_SCORE_LEVELS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchScoreLevels = useCallback(async () => {
        // Prevent duplicate fetches
        if (hasFetched && scoreLevels.length > 0) {
            return;
        }

        try {
            setLoading(true);
            const response = await scoreLevelApi.getAll();
            const sorted = response.data.sort((a, b) => a.scoreValue - b.scoreValue);
            setScoreLevels(sorted.length > 0 ? sorted : DEFAULT_SCORE_LEVELS);
            setError(null);
            setHasFetched(true);
        } catch (err) {
            console.error('Failed to fetch score levels:', err);
            setError('Failed to load score levels');
            setScoreLevels(DEFAULT_SCORE_LEVELS);
        } finally {
            setLoading(false);
        }
    }, [hasFetched, scoreLevels.length]);

    const refreshScoreLevels = useCallback(async () => {
        setHasFetched(false);
        try {
            setLoading(true);
            const response = await scoreLevelApi.getAll();
            const sorted = response.data.sort((a, b) => a.scoreValue - b.scoreValue);
            setScoreLevels(sorted.length > 0 ? sorted : DEFAULT_SCORE_LEVELS);
            setError(null);
            setHasFetched(true);
        } catch (err) {
            console.error('Failed to refresh score levels:', err);
            setError('Failed to refresh score levels');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScoreLevels();
    }, []);

    return (
        <ScoreLevelContext.Provider value={{ scoreLevels, loading, error, refreshScoreLevels }}>
            {children}
        </ScoreLevelContext.Provider>
    );
};

export const useScoreLevels = (): ScoreLevelContextType => {
    const context = useContext(ScoreLevelContext);
    if (context === undefined) {
        throw new Error('useScoreLevels must be used within a ScoreLevelProvider');
    }
    return context;
};

export default ScoreLevelContext;
