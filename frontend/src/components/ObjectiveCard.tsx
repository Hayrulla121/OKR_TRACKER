import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Objective, KeyResult } from '../types/okr';
import { keyResultApi } from '../services/api';
import Speedometer from './Speedometer';

interface ObjectiveCardProps {
    objective: Objective;
    onUpdate: () => void;
}

const ObjectiveCard: React.FC<ObjectiveCardProps> = ({ objective, onUpdate }) => {
    const [expanded, setExpanded] = useState(false);
    const defaultScore = { score: 0, level: 'below' as const, color: '#d9534f', percentage: 0 };

    // Local state to track input values for each key result
    const [localValues, setLocalValues] = useState<Record<string, string>>({});

    // Track which input currently has focus
    const focusedIdRef = useRef<string | null>(null);

    // Track if we're currently saving
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

    // Debounce timers
    const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

    // Sync local values with props when objective changes
    useEffect(() => {
        const newValues: Record<string, string> = {};
        objective.keyResults.forEach(kr => {
            if (focusedIdRef.current === kr.id) {
                newValues[kr.id] = localValues[kr.id] ?? kr.actualValue ?? '';
            } else {
                newValues[kr.id] = kr.actualValue ?? '';
            }
        });
        setLocalValues(newValues);
    }, [objective.keyResults]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
        };
    }, []);

    const saveValue = useCallback(async (krId: string, krData: KeyResult, value: string, skipRefresh = false) => {
        setSavingIds(prev => new Set(prev).add(krId));
        try {
            await keyResultApi.update(krId, { ...krData, actualValue: value });
            if (!skipRefresh) {
                if (focusedIdRef.current === krId) {
                    focusedIdRef.current = null;
                }
                onUpdate();
            }
        } catch (error) {
            console.error('Failed to update key result:', error);
        } finally {
            setSavingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(krId);
                return newSet;
            });
        }
    }, [onUpdate]);

    const handleActualValueChange = (kr: KeyResult, value: string) => {
        setLocalValues(prev => ({
            ...prev,
            [kr.id]: value
        }));

        if (debounceTimers.current[kr.id]) {
            clearTimeout(debounceTimers.current[kr.id]);
        }

        debounceTimers.current[kr.id] = setTimeout(() => {
            saveValue(kr.id, kr, value, true);
        }, 1000);
    };

    const handleFocus = (krId: string) => {
        focusedIdRef.current = krId;
    };

    const handleBlur = (kr: KeyResult) => {
        if (debounceTimers.current[kr.id]) {
            clearTimeout(debounceTimers.current[kr.id]);
            delete debounceTimers.current[kr.id];
        }

        const value = localValues[kr.id] ?? kr.actualValue ?? '';
        focusedIdRef.current = null;
        saveValue(kr.id, kr, value, false);
    };

    const getMetricTypeLabel = (type: string) => {
        switch (type) {
            case 'HIGHER_BETTER': return '↑ Higher is better';
            case 'LOWER_BETTER': return '↓ Lower is better';
            case 'QUALITATIVE': return 'A/B/C/D/E Grade';
            default: return type;
        }
    };

    return (
        <div className="border-2 border-slate-200 rounded-xl bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-md transition-shadow">
            <div
                className="flex items-center justify-between cursor-pointer p-5"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-slate-800 text-lg">{objective.name}</h3>
                        <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          {objective.weight}%
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        {objective.keyResults.length} Key Result{objective.keyResults.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Speedometer score={objective.score || defaultScore} size="sm" showLabel={false} />
                    <span className="text-slate-400 text-xl">{expanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {expanded && (
                <div className="px-5 pb-5 space-y-3 border-t border-slate-200 pt-4">
                    {objective.keyResults.map((kr) => (
                        <div
                            key={kr.id}
                            className="bg-white p-5 rounded-xl border-2 border-slate-100 shadow-sm hover:border-amber-200 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-bold text-slate-800">{kr.name}</span>
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            {getMetricTypeLabel(kr.metricType)}
                                        </span>
                                    </div>
                                    {kr.description && (
                                        <p className="text-sm text-slate-600 mt-2">{kr.description}</p>
                                    )}

                                    {/* Threshold display */}
                                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                        <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-semibold border border-red-200">
                                            Below: {kr.thresholds.below}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 font-semibold border border-yellow-200">
                                            Meets: {kr.thresholds.meets}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-semibold border border-green-200">
                                            Good: {kr.thresholds.good}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                            Very Good: {kr.thresholds.veryGood}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                                            Exceptional: {kr.thresholds.exceptional}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 ml-4">
                                    {/* Actual value input */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-semibold text-slate-600">Actual:</label>
                                        {kr.metricType === 'QUALITATIVE' ? (
                                            <select
                                                value={localValues[kr.id] ?? kr.actualValue ?? 'E'}
                                                onChange={(e) => handleActualValueChange(kr, e.target.value)}
                                                onFocus={() => handleFocus(kr.id)}
                                                onBlur={() => handleBlur(kr)}
                                                disabled={savingIds.has(kr.id)}
                                                className="border-2 border-slate-300 rounded-lg px-3 py-2 w-20 font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
                                            >
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                                <option value="E">E</option>
                                            </select>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={localValues[kr.id] ?? kr.actualValue ?? ''}
                                                    onChange={(e) => handleActualValueChange(kr, e.target.value)}
                                                    onFocus={() => handleFocus(kr.id)}
                                                    onBlur={() => handleBlur(kr)}
                                                    disabled={savingIds.has(kr.id)}
                                                    className="border-2 border-slate-300 rounded-lg px-3 py-2 w-28 font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50"
                                                    placeholder="0"
                                                />
                                                {savingIds.has(kr.id) && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {kr.unit && <span className="text-sm font-medium text-slate-500">{kr.unit}</span>}
                                    </div>

                                    {/* Score badge */}
                                    {kr.score && (
                                        <div
                                            className="px-4 py-2 rounded-full text-white text-sm font-bold shadow-md"
                                            style={{ backgroundColor: kr.score.color }}
                                        >
                                            {kr.score.score.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ObjectiveCard;