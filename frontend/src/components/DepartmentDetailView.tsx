import React, { useEffect, useState } from 'react';
import { Department } from '../types/okr';
import { DepartmentScoreResult } from '../types/evaluation';
import { departmentScoresApi } from '../services/api';
import MultiSpeedometerDisplay from './MultiSpeedometerDisplay';
import EvaluationPanel from './evaluations/EvaluationPanel';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

interface Props {
    department: Department;
    onUpdate?: () => void;
}

const DepartmentDetailView: React.FC<Props> = ({ department, onUpdate }) => {
    const { user } = useAuth();
    const [scores, setScores] = useState<DepartmentScoreResult | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchScores = async () => {
        try {
            const response = await departmentScoresApi.getScores(department.id);
            setScores(response.data);
        } catch (err) {
            console.error('Failed to fetch department scores:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScores();
    }, [department.id]);

    const handleEvaluationSaved = () => {
        fetchScores();
        if (onUpdate) {
            onUpdate();
        }
    };

    const canEvaluate = user && [Role.DIRECTOR, Role.HR, Role.BUSINESS_BLOCK, Role.ADMIN].includes(user.role);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading department scores...</p>
                </div>
            </div>
        );
    }

    if (!scores) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 text-center">
                <p className="text-slate-600">Failed to load department scores</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Multi-Speedometer Display */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    {department.name} - Performance Scores
                </h2>
                <MultiSpeedometerDisplay scores={scores} />
            </div>

            {/* Evaluation Panel - Only show to users who can evaluate */}
            {canEvaluate && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <EvaluationPanel
                        targetType="DEPARTMENT"
                        targetId={department.id}
                        onEvaluationSaved={handleEvaluationSaved}
                    />
                </div>
            )}

            {/* Department Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Department Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-semibold text-gray-800">{department.name}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Objectives:</span>
                        <span className="ml-2 font-semibold text-gray-800">{department.objectives.length}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="text-gray-600">Key Results:</span>
                        <span className="ml-2 font-semibold text-gray-800">
                            {department.objectives.reduce((sum, obj) => sum + obj.keyResults.length, 0)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentDetailView;
