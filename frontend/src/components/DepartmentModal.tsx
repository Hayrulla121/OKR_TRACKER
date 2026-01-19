import React from 'react';
import { Department } from '../types/okr';
import Speedometer from './Speedometer';
import DepartmentCard from './DepartmentCard';
import { useLanguage } from '../i18n';

interface DepartmentModalProps {
    department: Department;
    onClose: () => void;
    onUpdate: () => void;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ department, onClose, onUpdate }) => {
    const { t } = useLanguage();
    const defaultScore = { score: 3, level: 'below' as const, color: '#d9534f', percentage: 0 };

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
                return;
            }
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">{department.name}</h2>
                        <p className="text-amber-100 text-xs mt-0.5">{t.performanceDetails}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Speedometer and Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-4 border border-slate-200">
                            <h3 className="text-base font-bold text-slate-800 mb-3 text-center">{t.departmentScore}</h3>
                            <Speedometer score={department.score || defaultScore} size="sm" />
                        </div>

                        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 border border-slate-200">
                            <h3 className="text-base font-bold text-slate-800 mb-3">{t.scoreSummary}</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg">
                                    <div className="text-2xl font-bold text-amber-600">{department.objectives.length}</div>
                                    <div className="text-xs text-slate-600 mt-0.5">{t.objectivesLabel}</div>
                                </div>
                                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {department.objectives.reduce((sum, obj) => sum + obj.keyResults.length, 0)}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-0.5">{t.keyResultsLabel}</div>
                                </div>
                                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                                    <div className="text-2xl font-bold" style={{ color: department.score?.color || '#666' }}>
                                        {department.score?.score.toFixed(2) || '0.00'}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-0.5">{t.avgScore}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Objectives Breakdown */}
                    <div className="space-y-4">
                        {department.objectives.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-lg p-12 border border-slate-200 text-center">
                                <div className="text-5xl mb-3">🎯</div>
                                <h3 className="text-lg font-semibold text-slate-600 mb-1.5">{t.noObjectivesYet}</h3>
                                <p className="text-slate-400 text-sm">{t.addObjectivesFromSettings}</p>
                            </div>
                        ) : (
                            department.objectives.map((objective) => (
                                <DepartmentCard
                                    key={objective.id}
                                    department={department}
                                    objective={objective}
                                    onUpdate={onUpdate}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentModal;
