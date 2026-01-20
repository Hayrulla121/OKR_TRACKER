import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types/auth';
import { Evaluation } from '../../types/evaluation';
import { evaluationApi } from '../../services/api';
import DirectorEvaluationInput from './DirectorEvaluationInput';
import HrEvaluationInput from './HrEvaluationInput';
import BusinessBlockEvaluationInput from './BusinessBlockEvaluationInput';

interface Props {
    targetType: 'DEPARTMENT' | 'EMPLOYEE';
    targetId: string;
    onEvaluationSaved?: () => void;
}

const EvaluationPanel: React.FC<Props> = ({ targetType, targetId, onEvaluationSaved }) => {
    const { user } = useAuth();
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvaluations = async () => {
        try {
            const response = await evaluationApi.getForTarget(targetType, targetId);
            setEvaluations(response.data);
        } catch (err) {
            console.error('Failed to fetch evaluations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvaluations();
    }, [targetType, targetId]);

    const handleEvaluationSaved = () => {
        fetchEvaluations();
        if (onEvaluationSaved) {
            onEvaluationSaved();
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading evaluations...</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Find existing evaluation from current user
    const userEvaluation = evaluations.find(e => e.evaluatorId === user.id);

    // Determine if user can evaluate
    const canEvaluateAsDirector = user.role === Role.DIRECTOR || user.role === Role.ADMIN;
    const canEvaluateAsHR = user.role === Role.HR || user.role === Role.ADMIN;
    const canEvaluateAsBusinessBlock = user.role === Role.BUSINESS_BLOCK || user.role === Role.ADMIN;

    // Business Block can only evaluate departments
    const canEvaluateAsBusinessBlockForTarget = canEvaluateAsBusinessBlock && targetType === 'DEPARTMENT';

    const hasPermission = canEvaluateAsDirector || canEvaluateAsHR || canEvaluateAsBusinessBlockForTarget;

    if (!hasPermission) {
        return (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm text-gray-600">
                    You do not have permission to evaluate this {targetType.toLowerCase()}.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    Only Directors, HR, and Business Block leaders can provide evaluations.
                </p>
            </div>
        );
    }

    // If user already evaluated, show read-only view
    if (userEvaluation && userEvaluation.status !== 'DRAFT') {
        return (
            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-semibold text-green-800">You have already evaluated this {targetType.toLowerCase()}</h3>
                </div>
                <div className="text-sm text-green-700">
                    <p>Your evaluation has been submitted.</p>
                    {userEvaluation.comment && (
                        <div className="mt-2 p-2 bg-white rounded border border-green-200">
                            <p className="font-medium">Comment:</p>
                            <p className="text-gray-700">{userEvaluation.comment}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Provide Your Evaluation</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {canEvaluateAsDirector && (
                    <DirectorEvaluationInput
                        targetType={targetType}
                        targetId={targetId}
                        currentRating={userEvaluation?.numericRating}
                        currentComment={userEvaluation?.comment}
                        evaluationId={userEvaluation?.id}
                        onSave={handleEvaluationSaved}
                    />
                )}

                {canEvaluateAsHR && (
                    <HrEvaluationInput
                        targetType={targetType}
                        targetId={targetId}
                        currentRating={userEvaluation?.letterRating as 'A' | 'B' | 'C' | 'D' | undefined}
                        currentComment={userEvaluation?.comment}
                        evaluationId={userEvaluation?.id}
                        onSave={handleEvaluationSaved}
                    />
                )}

                {canEvaluateAsBusinessBlockForTarget && (
                    <BusinessBlockEvaluationInput
                        targetType={targetType}
                        targetId={targetId}
                        currentRating={userEvaluation?.numericRating}
                        currentComment={userEvaluation?.comment}
                        evaluationId={userEvaluation?.id}
                        onSave={handleEvaluationSaved}
                    />
                )}
            </div>
        </div>
    );
};

export default EvaluationPanel;
