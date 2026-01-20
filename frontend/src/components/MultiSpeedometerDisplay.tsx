import React from 'react';
import Speedometer from './Speedometer';
import SpeedometerABCD from './SpeedometerABCD';
import { DepartmentScoreResult } from '../types/evaluation';
import { ScoreResult } from '../types/okr';

interface Props {
    scores: DepartmentScoreResult;
}

const MultiSpeedometerDisplay: React.FC<Props> = ({ scores }) => {
    // Convert numeric scores to ScoreResult format for existing Speedometer component
    const createScoreResult = (score: number | undefined, label: string): ScoreResult => {
        if (score === undefined || score === null) {
            return { score: 0, level: 'below', color: '#d1d5db', percentage: 0 };
        }

        let level: ScoreResult['level'];
        let color: string;

        if (score >= 5) {
            level = 'exceptional';
            color = '#1e7b34';
        } else if (score >= 4.75) {
            level = 'very_good';
            color = '#28a745';
        } else if (score >= 4.5) {
            level = 'good';
            color = '#5cb85c';
        } else if (score >= 4.25) {
            level = 'meets';
            color = '#f0ad4e';
        } else {
            level = 'below';
            color = '#d9534f';
        }

        const percentage = ((score - 3) / 2) * 100;

        return {
            score,
            level,
            color,
            percentage: Math.max(0, Math.min(100, percentage))
        };
    };

    const autoScore = createScoreResult(scores.automaticOkrScore, 'Automatic OKR');
    const directorScore = createScoreResult(scores.directorEvaluation, 'Director');
    const businessBlockScore = createScoreResult(scores.businessBlockEvaluation, 'Business Block');
    const finalScore = createScoreResult(scores.finalCombinedScore, 'Final');

    return (
        <div className="space-y-6">
            {/* Main weighted scores (3 speedometers) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Automatic OKR Score (60%) */}
                <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-blue-200">
                    <div className="flex items-center justify-center mb-2">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-blue-600 font-bold text-sm">60% Weight</span>
                    </div>
                    <Speedometer
                        score={autoScore}
                        size="md"
                        compact={false}
                        glow={true}
                    />
                    <p className="text-center mt-3 text-xs text-gray-600 font-medium">
                        Automatic OKR Score
                    </p>
                    <p className="text-center text-xs text-gray-500">
                        Based on key result thresholds
                    </p>
                </div>

                {/* Director Evaluation (20%) */}
                <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-purple-200">
                    <div className="flex items-center justify-center mb-2">
                        <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-purple-600 font-bold text-sm">20% Weight</span>
                    </div>
                    {scores.hasDirectorEvaluation ? (
                        <>
                            <Speedometer
                                score={directorScore}
                                size="md"
                                compact={false}
                                glow={true}
                            />
                            <p className="text-center mt-3 text-xs text-gray-600 font-medium">
                                Director Evaluation
                            </p>
                            {scores.directorStars && (
                                <p className="text-center text-xs text-gray-500">
                                    {scores.directorStars} {scores.directorStars === 1 ? 'star' : 'stars'} rating
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48">
                            <svg className="w-16 h-16 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-sm text-gray-500 font-medium">Not Evaluated</p>
                            <p className="text-xs text-gray-400">Awaiting director rating</p>
                        </div>
                    )}
                </div>

                {/* HR Evaluation (20%) */}
                <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-blue-200">
                    <div className="flex items-center justify-center mb-2">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span className="text-blue-600 font-bold text-sm">20% Weight</span>
                    </div>
                    {scores.hasHrEvaluation ? (
                        <SpeedometerABCD
                            value={scores.hrEvaluationLetter as 'A' | 'B' | 'C' | 'D'}
                            title="HR Evaluation"
                            subtitle="Performance grade"
                            size="md"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48">
                            <svg className="w-16 h-16 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-sm text-gray-500 font-medium">Not Evaluated</p>
                            <p className="text-xs text-gray-400">Awaiting HR rating</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Secondary row: Business Block (separate) + Final Combined (large) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Business Block - Separate Display (No weight in final score) */}
                <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-teal-200">
                    <div className="flex items-center justify-center mb-2">
                        <svg className="w-5 h-5 text-teal-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-teal-600 font-bold text-sm">Separate Display</span>
                    </div>
                    {scores.hasBusinessBlockEvaluation ? (
                        <>
                            <Speedometer
                                score={businessBlockScore}
                                size="md"
                                compact={false}
                                glow={true}
                            />
                            <p className="text-center mt-3 text-xs text-gray-600 font-medium">
                                Business Block
                            </p>
                            <p className="text-center text-xs text-gray-500">
                                Not included in weighted score
                            </p>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48">
                            <svg className="w-16 h-16 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-sm text-gray-500 font-medium">Not Evaluated</p>
                            <p className="text-xs text-gray-400">Awaiting business rating</p>
                        </div>
                    )}
                </div>

                {/* Final Combined Score - Large prominent display */}
                <div className="md:col-span-2 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl shadow-xl p-6 border-4 border-primary relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-cyan-600"></div>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-primary mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent">
                                Final Combined Score
                            </h2>
                        </div>

                        {scores.finalCombinedScore ? (
                            <>
                                <Speedometer
                                    score={finalScore}
                                    size="lg"
                                    compact={false}
                                    glow={true}
                                />
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-600 font-medium mb-2">
                                        Weighted Formula: (OKR × 60%) + (Director × 20%) + (HR × 20%)
                                    </p>
                                    <div className="flex justify-center gap-4 text-xs text-gray-500">
                                        <span>OKR: {scores.automaticOkrScore?.toFixed(2) || 'N/A'}</span>
                                        <span>Director: {scores.directorEvaluation?.toFixed(2) || 'N/A'}</span>
                                        <span>HR: {scores.hrEvaluationNumeric?.toFixed(2) || 'N/A'}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <svg className="w-20 h-20 text-primary opacity-30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p className="text-lg text-gray-700 font-semibold mb-1">Final Score Not Available</p>
                                <p className="text-sm text-gray-500 text-center">
                                    Requires automatic OKR score + Director evaluation + HR evaluation
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiSpeedometerDisplay;
