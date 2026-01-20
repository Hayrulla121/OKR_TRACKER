import React from 'react';
import { Department } from '../types/okr';
import DepartmentCard from './DepartmentCard';
import DepartmentDetailView from './DepartmentDetailView';
import { useLanguage } from '../i18n';

interface DepartmentModalProps {
    department: Department;
    onClose: () => void;
    onUpdate: () => void;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ department, onClose, onUpdate }) => {
    const { t } = useLanguage();

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
                <div className="bg-gradient-to-r from-[#5A9CB5] to-cyan-600 text-white p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">{department.name}</h2>
                        <p className="text-cyan-100 text-xs mt-0.5">{t.performanceDetails}</p>
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
                    {/* Department Detail View with Multi-Speedometer and Evaluation Panel */}
                    <DepartmentDetailView
                        department={department}
                        onUpdate={onUpdate}
                    />

                    {/* Objectives Breakdown */}
                    <div className="mt-6 space-y-4">
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
