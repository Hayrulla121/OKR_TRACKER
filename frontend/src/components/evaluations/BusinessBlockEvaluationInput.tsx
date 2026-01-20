import React, { useState } from 'react';
import { evaluationApi } from '../../services/api';
import { EvaluatorType } from '../../types/evaluation';

interface Props {
    targetType: 'DEPARTMENT' | 'EMPLOYEE';
    targetId: string;
    currentRating?: number; // 1-5
    currentComment?: string;
    evaluationId?: string;
    onSave: () => void;
    disabled?: boolean;
}

const BusinessBlockEvaluationInput: React.FC<Props> = ({
    targetType,
    targetId,
    currentRating,
    currentComment,
    evaluationId,
    onSave,
    disabled = false
}) => {
    const [rating, setRating] = useState<number>(currentRating || 0);
    const [comment, setComment] = useState<string>(currentComment || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        if (rating === 0) {
            setError('Please select a rating (1-5)');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const data = {
                targetType,
                targetId,
                evaluatorType: EvaluatorType.BUSINESS_BLOCK,
                numericRating: rating,
                comment: comment.trim() || undefined
            };

            if (evaluationId) {
                // Update existing evaluation
                await evaluationApi.update(evaluationId, data);
            } else {
                // Create new evaluation
                await evaluationApi.create(data);
            }

            setSuccess(true);
            setTimeout(() => {
                onSave();
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save evaluation');
        } finally {
            setLoading(false);
        }
    };

    const getRatingColor = (value: number) => {
        if (value >= 4.5) return 'bg-green-500';
        if (value >= 3.5) return 'bg-blue-500';
        if (value >= 2.5) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    const getRatingLabel = (value: number) => {
        if (value === 5) return 'Exceptional';
        if (value === 4) return 'Very Good';
        if (value === 3) return 'Good';
        if (value === 2) return 'Fair';
        if (value === 1) return 'Needs Improvement';
        return '';
    };

    return (
        <div className="bg-white rounded-lg border-2 border-teal-200 p-4">
            <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-bold text-teal-700">Business Block Evaluation</h3>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (1-5 scale)
                </label>

                {/* Slider */}
                <div className="mb-3">
                    <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={rating || 3}
                        onChange={(e) => setRating(parseInt(e.target.value))}
                        disabled={disabled || loading}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                </div>

                {/* Numeric buttons */}
                <div className="flex gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            type="button"
                            disabled={disabled || loading}
                            onClick={() => setRating(value)}
                            className={`flex-1 py-2 px-3 rounded-md border-2 font-semibold transition-all ${
                                rating === value
                                    ? `${getRatingColor(value)} text-white border-transparent shadow-lg scale-105`
                                    : 'bg-white border-gray-300 hover:border-teal-500'
                            } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {value}
                        </button>
                    ))}
                </div>

                {rating > 0 && (
                    <div className="text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${getRatingColor(rating)}`}>
                            {rating}/5 - {getRatingLabel(rating)}
                        </span>
                    </div>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment (optional)
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={disabled || loading}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                    placeholder="Add your evaluation comments..."
                />
            </div>

            {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    Evaluation saved successfully!
                </div>
            )}

            <button
                onClick={handleSave}
                disabled={disabled || loading || rating === 0}
                className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {loading ? 'Saving...' : evaluationId ? 'Update Evaluation' : 'Submit Evaluation'}
            </button>

            <style>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #0d9488;
                    cursor: pointer;
                }
                .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #0d9488;
                    cursor: pointer;
                    border: none;
                }
            `}</style>
        </div>
    );
};

export default BusinessBlockEvaluationInput;
