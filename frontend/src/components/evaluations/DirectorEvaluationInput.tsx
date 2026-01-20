import React, { useState } from 'react';
import { evaluationApi } from '../../services/api';
import { EvaluatorType } from '../../types/evaluation';

interface Props {
    targetType: 'DEPARTMENT' | 'EMPLOYEE';
    targetId: string;
    currentRating?: number; // 1-5 stars
    currentComment?: string;
    evaluationId?: string;
    onSave: () => void;
    disabled?: boolean;
}

const DirectorEvaluationInput: React.FC<Props> = ({
    targetType,
    targetId,
    currentRating,
    currentComment,
    evaluationId,
    onSave,
    disabled = false
}) => {
    const [stars, setStars] = useState<number>(currentRating || 0);
    const [comment, setComment] = useState<string>(currentComment || '');
    const [hoveredStar, setHoveredStar] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        if (stars === 0) {
            setError('Please select a star rating (1-5)');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await evaluationApi.create({
                targetType,
                targetId,
                evaluatorType: EvaluatorType.DIRECTOR,
                starRating: stars,
                comment: comment.trim() || undefined
            });

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

    const renderStar = (position: number) => {
        const filled = (hoveredStar || stars) >= position;

        return (
            <button
                key={position}
                type="button"
                disabled={disabled || loading}
                onMouseEnter={() => setHoveredStar(position)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setStars(position)}
                className={`text-4xl transition-all duration-150 ${
                    disabled || loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
                }`}
            >
                {filled ? (
                    <span className="text-yellow-400">★</span>
                ) : (
                    <span className="text-gray-300">☆</span>
                )}
            </button>
        );
    };

    return (
        <div className="bg-white rounded-lg border-2 border-purple-200 p-4">
            <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="text-lg font-bold text-purple-700">Director Evaluation</h3>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (1-5 stars)
                </label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(renderStar)}
                </div>
                {stars > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                        Selected: {stars} {stars === 1 ? 'star' : 'stars'}
                    </p>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
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
                disabled={disabled || loading || stars === 0}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {loading ? 'Saving...' : evaluationId ? 'Update Evaluation' : 'Submit Evaluation'}
            </button>
        </div>
    );
};

export default DirectorEvaluationInput;
