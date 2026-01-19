import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Department, Objective, KeyResult } from '../types/okr';
import { keyResultApi } from '../services/api';
import Speedometer from './Speedometer';
import { useLanguage } from '../i18n';

interface DepartmentCardProps {
    department: Department;
    objective: Objective;
    onUpdate: () => void;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, objective, onUpdate }) => {
    const { t } = useLanguage();
    const [expanded, setExpanded] = useState(true);
    const [localValues, setLocalValues] = useState<Record<string, string>>({});
    const focusedIdRef = useRef<string | null>(null);
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

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
        if (score >= 5) return t.exceptional;
        if (score >= 4.75) return t.veryGood;
        if (score >= 4.5) return t.good;
        if (score >= 4.25) return t.meets;
        return t.below;
    };

    const getScoreLevelColor = (score: number): string => {
        if (score >= 5) return '#1e7b34';
        if (score >= 4.75) return '#28a745';
        if (score >= 4.5) return '#5cb85c';
        if (score >= 4.25) return '#f0ad4e';
        return '#d9534f';
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
                className="bg-gradient-to-r from-amber-400 to-amber-500 p-4 cursor-pointer"
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
                        <p className="text-amber-100 text-xs mt-0.5">
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
                                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
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
                                <tr className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                                    <th className="px-3 py-2 text-left font-bold">KR</th>
                                    <th className="px-3 py-2 text-left font-bold">{t.keyResult}</th>
                                    <th className="px-3 py-2 text-center font-bold">{t.actual}</th>
                                    <th className="px-3 py-2 text-center font-bold bg-red-600">
                                        {t.below}<br/>3.00
                                    </th>
                                    <th className="px-3 py-2 text-center font-bold bg-orange-500">
                                        {t.meets}<br/>4.25
                                    </th>
                                    <th className="px-3 py-2 text-center font-bold bg-lime-500">
                                        {t.good}<br/>4.50
                                    </th>
                                    <th className="px-3 py-2 text-center font-bold bg-green-600">
                                        {t.veryGood}<br/>4.75
                                    </th>
                                    <th className="px-3 py-2 text-center font-bold bg-emerald-700">
                                        {t.exceptional}<br/>5.00
                                    </th>
                                    <th className="px-3 py-2 text-center font-bold">{t.score}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {objective.keyResults.map((kr, index) => (
                                    <tr
                                        key={kr.id}
                                        className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-orange-50'} hover:bg-amber-50 transition-colors`}
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
                                                    className="border-2 border-orange-300 rounded-md px-2 py-1 font-bold text-center focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs disabled:opacity-50"
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
                                                        className="border-2 border-orange-300 rounded-md px-2 py-1 w-20 font-bold text-center focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs disabled:opacity-50"
                                                        placeholder="0"
                                                    />
                                                    {savingIds.has(kr.id) && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {kr.unit && (
                                                        <div className="text-xs text-slate-500 mt-0.5">{kr.unit}</div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-center bg-red-50 font-semibold">
                                            {kr.metricType === 'LOWER_BETTER' ? '>' : '<'}{kr.thresholds.below}
                                        </td>
                                        <td className="px-3 py-3 text-center bg-orange-50 font-semibold">
                                            ≥{kr.thresholds.meets}
                                        </td>
                                        <td className="px-3 py-3 text-center bg-lime-50 font-semibold">
                                            ≥{kr.thresholds.good}
                                        </td>
                                        <td className="px-3 py-3 text-center bg-green-50 font-semibold">
                                            ≥{kr.thresholds.veryGood}
                                        </td>
                                        <td className="px-3 py-3 text-center bg-emerald-50 font-semibold">
                                            ≥{kr.thresholds.exceptional}
                                        </td>
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
                                <tr className="bg-gradient-to-r from-yellow-100 to-amber-100 border-t-4 border-amber-400">
                                    <td colSpan={8} className="px-3 py-3 font-bold text-slate-800 text-right">
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
