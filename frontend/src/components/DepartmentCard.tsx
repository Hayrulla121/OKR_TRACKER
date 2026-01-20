import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Department, Objective, KeyResult, ScoreLevel } from '../types/okr';
import { keyResultApi, scoreLevelApi } from '../services/api';
import Speedometer from './Speedometer';
import { useLanguage } from '../i18n';

interface DepartmentCardProps {
    department: Department;
    objective: Objective;
    onUpdate: () => void;
    scoreLevels?: ScoreLevel[];
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, objective, onUpdate, scoreLevels: propScoreLevels }) => {
    const { t } = useLanguage();
    const [expanded, setExpanded] = useState(true);
    const [localValues, setLocalValues] = useState<Record<string, string>>({});
    const focusedIdRef = useRef<string | null>(null);
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
    const [scoreLevels, setScoreLevels] = useState<ScoreLevel[]>(propScoreLevels || []);

    // Fetch score levels if not provided via props
    useEffect(() => {
        if (!propScoreLevels) {
            scoreLevelApi.getAll()
                .then(response => {
                    setScoreLevels(response.data.sort((a, b) => a.scoreValue - b.scoreValue));
                })
                .catch(err => console.error('Failed to fetch score levels:', err));
        } else {
            setScoreLevels(propScoreLevels);
        }
    }, [propScoreLevels]);

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

    useEffect(() => {
        return () => {
            Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
        };
    }, []);

    const saveValue = useCallback(async (krId: string, value: string, skipRefresh = false) => {
        setSavingIds(prev => new Set(prev).add(krId));
        try {
            await keyResultApi.updateActualValue(krId, value);
            if (!skipRefresh) {
                if (focusedIdRef.current === krId) {
                    focusedIdRef.current = null;
                }
                onUpdate();
            }
        } catch (err) {
            console.error('Failed to update key result', err);
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
            saveValue(kr.id, value, true);
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
        saveValue(kr.id, value, false);
    };

    const handleRefresh = () => {
        Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
        debounceTimers.current = {};
        focusedIdRef.current = null;
        onUpdate();
    };

    const getScoreLevelLabel = (score: number): string => {
        if (scoreLevels.length === 0) {
            // Fallback to defaults
            if (score >= 5) return t.exceptional;
            if (score >= 4.75) return t.veryGood;
            if (score >= 4.5) return t.good;
            if (score >= 4.25) return t.meets;
            return t.below;
        }
        // Find the appropriate level from dynamic score levels
        for (let i = scoreLevels.length - 1; i >= 0; i--) {
            if (score >= scoreLevels[i].scoreValue) {
                return scoreLevels[i].name;
            }
        }
        return scoreLevels[0]?.name || t.below;
    };

    const getScoreLevelColor = (score: number): string => {
        if (scoreLevels.length === 0) {
            // Fallback to defaults
            if (score >= 5) return '#1e7b34';
            if (score >= 4.75) return '#28a745';
            if (score >= 4.5) return '#5cb85c';
            if (score >= 4.25) return '#f0ad4e';
            return '#d9534f';
        }
        // Find the appropriate color from dynamic score levels
        for (let i = scoreLevels.length - 1; i >= 0; i--) {
            if (score >= scoreLevels[i].scoreValue) {
                return scoreLevels[i].color;
            }
        }
        return scoreLevels[0]?.color || '#d9534f';
    };

    // Map backend's 5-threshold structure to dynamic score levels
    const getThresholdsForDisplay = (kr: KeyResult): { name: string; value: number; color: string }[] => {
        const backendThresholds = [
            kr.thresholds.below,
            kr.thresholds.meets,
            kr.thresholds.good,
            kr.thresholds.veryGood,
            kr.thresholds.exceptional
        ];

        if (scoreLevels.length === 0) {
            // Fallback defaults
            return [
                { name: t.below, value: backendThresholds[0], color: '#dc3545' },
                { name: t.meets, value: backendThresholds[1], color: '#ffc107' },
                { name: t.good, value: backendThresholds[2], color: '#5cb85c' },
                { name: t.veryGood, value: backendThresholds[3], color: '#28a745' },
                { name: t.exceptional, value: backendThresholds[4], color: '#1e7b34' }
            ];
        }

        const sortedLevels = [...scoreLevels].sort((a, b) => a.scoreValue - b.scoreValue);
        const result: { name: string; value: number; color: string }[] = [];

        if (sortedLevels.length === 5) {
            // Direct mapping
            sortedLevels.forEach((level, i) => {
                result.push({ name: level.name, value: backendThresholds[i], color: level.color });
            });
        } else if (sortedLevels.length === 4) {
            // Map: below->0, meets->1, good->2, exceptional->4
            result.push({ name: sortedLevels[0].name, value: backendThresholds[0], color: sortedLevels[0].color });
            result.push({ name: sortedLevels[1].name, value: backendThresholds[1], color: sortedLevels[1].color });
            result.push({ name: sortedLevels[2].name, value: backendThresholds[2], color: sortedLevels[2].color });
            result.push({ name: sortedLevels[3].name, value: backendThresholds[4], color: sortedLevels[3].color });
        } else if (sortedLevels.length === 3) {
            // Map: below->0, good->2, exceptional->4
            result.push({ name: sortedLevels[0].name, value: backendThresholds[0], color: sortedLevels[0].color });
            result.push({ name: sortedLevels[1].name, value: backendThresholds[2], color: sortedLevels[1].color });
            result.push({ name: sortedLevels[2].name, value: backendThresholds[4], color: sortedLevels[2].color });
        } else if (sortedLevels.length === 2) {
            // Map: below->0, exceptional->4
            result.push({ name: sortedLevels[0].name, value: backendThresholds[0], color: sortedLevels[0].color });
            result.push({ name: sortedLevels[1].name, value: backendThresholds[4], color: sortedLevels[1].color });
        } else {
            // Single level or empty - just show whatever we have
            sortedLevels.forEach((level, i) => {
                result.push({ name: level.name, value: backendThresholds[Math.min(i, 4)], color: level.color });
            });
        }

        return result;
    };

    const getMetricTypeLabel = (metricType: string): string => {
        switch (metricType) {
            case 'HIGHER_BETTER': return t.higherIsBetter;
            case 'LOWER_BETTER': return t.lowerIsBetter;
            default: return t.qualitative;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden">
            {/* Objective Header */}
            <div
                className="bg-gradient-to-r from-[#5A9CB5] to-cyan-600 p-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">{objective.name}</h3>
                            <span className="bg-white/30 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                {t.weight}: {objective.weight}%
                            </span>
                        </div>
                        <p className="text-cyan-100 text-xs mt-0.5">
                            {objective.keyResults.length} {t.keyResult}{objective.keyResults.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {objective.score && (
                            <div className="bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                                <div className="text-xs text-amber-100">{t.avg}</div>
                                <div className="text-lg font-bold text-white">
                                    {objective.score.score.toFixed(2)}
                                </div>
                            </div>
                        )}
                        <span className="text-white text-lg">{expanded ? '▲' : '▼'}</span>
                    </div>
                </div>
            </div>

            {/* Results Breakdown */}
            {expanded && (
                <div className="p-4">
                    {/* Score Gauge and Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                        <div className="lg:col-span-1 flex items-center justify-center">
                            <Speedometer score={objective.score || { score: 3, level: 'below', color: '#d9534f', percentage: 0 }} size="sm" />
                        </div>
                        <div className="lg:col-span-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-slate-800">{t.scoreAssessment}</h4>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRefresh();
                                    }}
                                    className="px-3 py-1 bg-[#5A9CB5] hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {t.refreshScores}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-xs text-slate-600">{t.scoreLevel}</div>
                                    <div
                                        className="text-lg font-bold mt-0.5"
                                        style={{ color: getScoreLevelColor(objective.score?.score || 3) }}
                                    >
                                        {getScoreLevelLabel(objective.score?.score || 3)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-600">{t.averageScore}</div>
                                    <div
                                        className="text-lg font-bold mt-0.5"
                                        style={{ color: objective.score?.color || '#666' }}
                                    >
                                        {objective.score?.score.toFixed(2) || '0.00'} / 5.00
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Breakdown Table */}
                    <div className="bg-white rounded-lg border-2 border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-3 py-2 border-b-2 border-slate-200">
                            <h4 className="text-sm font-bold text-slate-800">{t.resultsBreakdown}</h4>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                <tr className="bg-gradient-to-r from-[#5A9CB5] to-cyan-600 text-white">
                                    <th className="px-3 py-2 text-left font-bold">KR</th>
                                    <th className="px-3 py-2 text-left font-bold">{t.keyResult}</th>
                                    <th className="px-3 py-2 text-center font-bold">{t.actual}</th>
                                    {(scoreLevels.length > 0 ? [...scoreLevels].sort((a, b) => a.scoreValue - b.scoreValue) : [
                                        { name: t.below, scoreValue: 3.0, color: '#dc3545' },
                                        { name: t.meets, scoreValue: 4.25, color: '#f0ad4e' },
                                        { name: t.good, scoreValue: 4.5, color: '#5cb85c' },
                                        { name: t.veryGood, scoreValue: 4.75, color: '#28a745' },
                                        { name: t.exceptional, scoreValue: 5.0, color: '#1e7b34' }
                                    ]).map((level) => (
                                        <th
                                            key={level.name}
                                            className="px-3 py-2 text-center font-bold"
                                            style={{ backgroundColor: level.color }}
                                        >
                                            {level.name}<br/>{level.scoreValue.toFixed(2)}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2 text-center font-bold">{t.score}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {objective.keyResults.map((kr, index) => (
                                    <tr
                                        key={kr.id}
                                        className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-sky-50'} hover:bg-cyan-50 transition-colors`}
                                    >
                                        <td className="px-3 py-3 font-bold text-slate-700">
                                            KR{index + 1}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="font-semibold text-slate-800">{kr.name}</div>
                                            {kr.description && (
                                                <div className="text-xs text-slate-500 mt-0.5">{kr.description}</div>
                                            )}
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {getMetricTypeLabel(kr.metricType)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {kr.metricType === 'QUALITATIVE' ? (
                                                <select
                                                    value={localValues[kr.id] ?? kr.actualValue ?? 'E'}
                                                    onChange={(e) => handleActualValueChange(kr, e.target.value)}
                                                    onFocus={() => handleFocus(kr.id)}
                                                    onBlur={() => handleBlur(kr)}
                                                    disabled={savingIds.has(kr.id)}
                                                    className="border-2 border-sky-300 rounded-md px-2 py-1 font-bold text-center focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5] text-xs disabled:opacity-50"
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
                                                        className="border-2 border-sky-300 rounded-md px-2 py-1 w-20 font-bold text-center focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5] text-xs disabled:opacity-50"
                                                        placeholder="0"
                                                    />
                                                    {savingIds.has(kr.id) && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-4 h-4 border-2 border-[#5A9CB5] border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {kr.unit && (
                                                        <div className="text-xs text-slate-500 mt-0.5">{kr.unit}</div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        {getThresholdsForDisplay(kr).map((threshold, thresholdIndex) => (
                                            <td
                                                key={threshold.name}
                                                className="px-3 py-3 text-center font-semibold"
                                                style={{ backgroundColor: `${threshold.color}20` }}
                                            >
                                                {thresholdIndex === 0
                                                    ? (kr.metricType === 'LOWER_BETTER' ? '>' : '<')
                                                    : '≥'
                                                }{threshold.value}
                                            </td>
                                        ))}
                                        <td className="px-3 py-3 text-center">
                                            {kr.score && (
                                                <div
                                                    className="inline-block px-3 py-1.5 rounded-full text-white font-bold shadow-md text-xs"
                                                    style={{ backgroundColor: kr.score.color }}
                                                >
                                                    {kr.score.score.toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {/* Overall Calculation Row */}
                                <tr className="bg-gradient-to-r from-sky-100 to-cyan-100 border-t-4 border-[#5A9CB5]">
                                    <td colSpan={3 + (scoreLevels.length > 0 ? scoreLevels.length : 5)} className="px-3 py-3 font-bold text-slate-800 text-right">
                                        {t.averageScore} (Sum of all KR scores / {objective.keyResults.length}) =
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <div
                                            className="inline-block px-4 py-2 rounded-lg text-white font-bold text-sm shadow-lg"
                                            style={{ backgroundColor: objective.score?.color || '#666' }}
                                        >
                                            {objective.score?.score.toFixed(2) || '0.00'}
                                        </div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentCard;
