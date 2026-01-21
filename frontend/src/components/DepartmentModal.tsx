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
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const scrollPositionRef = React.useRef<number>(0);

    // Preserve scroll position across updates
    const handleUpdate = React.useCallback(() => {
        // Save current scroll position before update
        if (scrollContainerRef.current) {
            scrollPositionRef.current = scrollContainerRef.current.scrollTop;
        }
        onUpdate();
    }, [onUpdate]);

    // Restore scroll position after re-render
    React.useEffect(() => {
        if (scrollContainerRef.current && scrollPositionRef.current > 0) {
            scrollContainerRef.current.scrollTop = scrollPositionRef.current;
        }
    }, [department]);

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
                className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header - Compact */}
                <div className="bg-gradient-to-r from-[#5A9CB5] to-cyan-600 text-white px-4 py-2 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold">{department.name}</h2>
                        <p className="text-cyan-100 text-xs">{t.performanceDetails}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3">
                    {/* Department Detail View with Multi-Speedometer and Evaluation Panel */}
                    <DepartmentDetailView
                        department={department}
                        onUpdate={handleUpdate}
                    />

                    {/* Objectives Breakdown */}
                    <div className="mt-3 space-y-2">
                        {department.objectives.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-6 border border-slate-200 text-center">
                                <div className="text-3xl mb-2">🎯</div>
                                <h3 className="text-sm font-semibold text-slate-600 mb-1">{t.noObjectivesYet}</h3>
                                <p className="text-slate-400 text-xs">{t.addObjectivesFromSettings}</p>
                            </div>
                        ) : (
                            department.objectives.map((objective) => (
                                <DepartmentCard
                                    key={objective.id}
                                    department={department}
                                    objective={objective}
                                    onUpdate={handleUpdate}
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
