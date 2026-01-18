import React, { useState } from 'react';
import { Department, Objective, KeyResult } from '../types/okr';
import { keyResultApi } from '../services/api';
import Speedometer from './Speedometer';

interface DepartmentCardProps {
    department: Department;
    objective: Objective;
    onUpdate: () => void;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, objective, onUpdate }) => {
    const [expanded, setExpanded] = useState(true);

    const handleActualValueChange = async (kr: KeyResult, value: string) => {
        try {
            await keyResultApi.updateActualValue(kr.id, value);
            onUpdate();
        } catch (err) {
            console.error('Failed to update key result', err);
        }
    };

    const getScoreLevelLabel = (score: number): string => {
        if (score >= 5) return 'Exceptional';
        if (score >= 4.75) return 'Very Good';
        if (score >= 4.5) return 'Good';
        if (score >= 4.25) return 'Meets';
        return 'Below';
    };

    const getScoreLevelColor = (score: number): string => {
        if (score >= 5) return '#1e7b34';
        if (score >= 4.75) return '#28a745';
        if (score >= 4.5) return '#5cb85c';
        if (score >= 4.25) return '#f0ad4e';
        return '#d9534f';
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
                                Weight: {objective.weight}%
                            </span>
                        </div>
                        <p className="text-amber-100 text-xs mt-0.5">
                            {objective.keyResults.length} Key Result{objective.keyResults.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {objective.score && (
                            <div className="bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                                <div className="text-xs text-amber-100">Avg</div>
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
                            <h4 className="text-sm font-bold text-slate-800 mb-3">Score Assessment</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-xs text-slate-600">Score Level</div>
                                    <div
                                        className="text-lg font-bold mt-0.5"
                                        style={{ color: getScoreLevelColor(objective.score?.score || 3) }}
                                    >
                                        {getScoreLevelLabel(objective.score?.score || 3)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-600">Average Score</div>
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
                            <h4 className="text-sm font-bold text-slate-800">Results Breakdown</h4>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                                        <th className="px-3 py-2 text-left font-bold">KR</th>
                                        <th className="px-3 py-2 text-left font-bold">Key Result</th>
                                        <th className="px-3 py-2 text-center font-bold">Actual</th>
                                        <th className="px-3 py-2 text-center font-bold bg-red-600">
                                            Below<br/>3.00
                                        </th>
                                        <th className="px-3 py-2 text-center font-bold bg-orange-500">
                                            Meets<br/>4.25
                                        </th>
                                        <th className="px-3 py-2 text-center font-bold bg-lime-500">
                                            Good<br/>4.50
                                        </th>
                                        <th className="px-3 py-2 text-center font-bold bg-green-600">
                                            Very Good<br/>4.75
                                        </th>
                                        <th className="px-3 py-2 text-center font-bold bg-emerald-700">
                                            Exceptional<br/>5.00
                                        </th>
                                        <th className="px-3 py-2 text-center font-bold">Score</th>
                                        <th className="px-3 py-2 text-center font-bold">Actions</th>
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
                                                    {kr.metricType === 'HIGHER_BETTER' ? 'Higher is Better' :
                                                     kr.metricType === 'LOWER_BETTER' ? 'Lower is Better' : 'Qualitative'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {kr.metricType === 'QUALITATIVE' ? (
                                                    <select
                                                        value={kr.actualValue || 'E'}
                                                        onChange={(e) => handleActualValueChange(kr, e.target.value)}
                                                        className="border-2 border-orange-300 rounded-md px-2 py-1 font-bold text-center focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                                                    >
                                                        <option value="A">A</option>
                                                        <option value="B">B</option>
                                                        <option value="C">C</option>
                                                        <option value="D">D</option>
                                                        <option value="E">E</option>
                                                    </select>
                                                ) : (
                                                    <div>
                                                        <input
                                                            type="number"
                                                            value={kr.actualValue || ''}
                                                            onChange={(e) => handleActualValueChange(kr, e.target.value)}
                                                            className="border-2 border-orange-300 rounded-md px-2 py-1 w-20 font-bold text-center focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                                                            placeholder="0"
                                                        />
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
                                            <td className="px-3 py-3 text-center">
                                                <button
                                                    onClick={() => handleActualValueChange(kr, kr.actualValue || '0')}
                                                    className="text-amber-600 hover:text-amber-700 font-semibold"
                                                >
                                                    Refresh
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Overall Calculation Row */}
                                    <tr className="bg-gradient-to-r from-yellow-100 to-amber-100 border-t-4 border-amber-400">
                                        <td colSpan={8} className="px-3 py-3 font-bold text-slate-800 text-right">
                                            Average Score (Sum of all KR scores / {objective.keyResults.length}) =
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <div
                                                className="inline-block px-4 py-2 rounded-lg text-white font-bold text-sm shadow-lg"
                                                style={{ backgroundColor: objective.score?.color || '#666' }}
                                            >
                                                {objective.score?.score.toFixed(2) || '0.00'}
                                            </div>
                                        </td>
                                        <td></td>
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
