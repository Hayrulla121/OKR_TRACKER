import React, { useEffect, useState } from 'react';
import { ScoreResult, ScoreLevel } from '../types/okr';
import { scoreLevelApi } from '../services/api';

interface SpeedometerProps {
    score: ScoreResult;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    glow?: boolean;
    compact?: boolean;
}

const Speedometer: React.FC<SpeedometerProps> = ({
    score,
    size = 'md',
    showLabel = true,
    glow = false,
    compact = false
}) => {
    const [scoreLevels, setScoreLevels] = useState<ScoreLevel[]>([]);

    useEffect(() => {
        const fetchScoreLevels = async () => {
            try {
                const response = await scoreLevelApi.getAll();
                // Sort by scoreValue to ensure proper ordering
                const sorted = response.data.sort((a, b) => a.scoreValue - b.scoreValue);
                setScoreLevels(sorted);
            } catch (error) {
                console.error('Failed to load score levels for speedometer:', error);
                // Fallback to defaults if API fails
                setScoreLevels([
                    { name: 'Below', scoreValue: 3.0, color: '#dc3545', displayOrder: 0 },
                    { name: 'Meets', scoreValue: 4.25, color: '#ffc107', displayOrder: 1 },
                    { name: 'Good', scoreValue: 4.5, color: '#5cb85c', displayOrder: 2 },
                    { name: 'Very Good', scoreValue: 4.75, color: '#28a745', displayOrder: 3 },
                    { name: 'Exceptional', scoreValue: 5.0, color: '#1e7b34', displayOrder: 4 },
                ]);
            }
        };
        fetchScoreLevels();
    }, []);
    const sizes = {
        sm: { width: 220, height: 150, radius: 65, strokeWidth: 16, fontSize: 20, titleSize: 'text-sm', labelFontSize: 10 },
        md: { width: 280, height: 190, radius: 85, strokeWidth: 20, fontSize: 26, titleSize: 'text-base', labelFontSize: 12 },
        lg: { width: 340, height: 230, radius: 105, strokeWidth: 24, fontSize: 32, titleSize: 'text-lg', labelFontSize: 14 },
    };

    const { width, height, radius, strokeWidth, fontSize, titleSize, labelFontSize } = sizes[size];

    const centerX = width / 2;
    const centerY = height - 20;

    // Get min and max scores from dynamic levels
    const minScore = scoreLevels.length > 0 ? scoreLevels[0].scoreValue : 3.0;
    const maxScore = scoreLevels.length > 0 ? scoreLevels[scoreLevels.length - 1].scoreValue : 5.0;
    const scoreRange = maxScore - minScore;

    // Convert score to percentage and angle
    const normalizedScore = Math.max(minScore, Math.min(maxScore, score.score));
    const percentage = ((normalizedScore - minScore) / scoreRange) * 100;
    const angle = 180 - (percentage / 100) * 180;

    // Arc paths for different score ranges
    const createArcPath = (startAngle: number, endAngle: number, r: number) => {
        const start = (180 - startAngle) * (Math.PI / 180);
        const end = (180 - endAngle) * (Math.PI / 180);

        const x1 = centerX + r * Math.cos(start);
        const y1 = centerY - r * Math.sin(start);
        const x2 = centerX + r * Math.cos(end);
        const y2 = centerY - r * Math.sin(end);

        const largeArc = (startAngle - endAngle) > 180 ? 1 : 0;

        return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
    };

    // Create dynamic score ranges based on score levels
    const scoreRanges = scoreLevels.length > 1 ? scoreLevels.slice(0, -1).map((level, index) => {
        const nextLevel = scoreLevels[index + 1];
        const startPct = ((level.scoreValue - minScore) / scoreRange) * 100;
        const endPct = ((nextLevel.scoreValue - minScore) / scoreRange) * 100;
        return {
            start: startPct,
            end: endPct,
            color: level.color,
        };
    }) : [
        { start: 0, end: 62.5, color: '#dc3545' },
        { start: 62.5, end: 75, color: '#ffc107' },
        { start: 75, end: 100, color: '#28a745' },
    ];

    // Needle position
    const needleAngle = (angle * Math.PI) / 180;
    const needleLength = radius - 10;
    const needleX = centerX + needleLength * Math.cos(needleAngle);
    const needleY = centerY - needleLength * Math.sin(needleAngle);

    // Dynamic tick marks and labels from score levels
    const minorTicks = scoreLevels.length > 0
        ? scoreLevels.map(level => level.scoreValue)
        : [3.0, 3.5, 4.0, 4.5, 5.0];

    const labels = scoreLevels.length > 0
        ? scoreLevels.map(level => ({
            value: level.scoreValue,
            label: level.scoreValue.toFixed(1)
        }))
        : [
            { value: 3.0, label: '3.0' },
            { value: 3.5, label: '3.5' },
            { value: 4.0, label: '4.0' },
            { value: 4.5, label: '4.5' },
            { value: 5.0, label: '5.0' }
        ];

    // Create dynamic level labels from fetched score levels
    const levelLabelsEn: Record<string, string> = scoreLevels.length > 0
        ? scoreLevels.reduce((acc, level) => {
            // Map both the original name and snake_case version
            const snakeCase = level.name.toLowerCase().replace(/\s+/g, '_');
            acc[snakeCase] = level.name;
            acc[level.name.toLowerCase()] = level.name;
            return acc;
        }, {} as Record<string, string>)
        : {
            below: 'Below',
            meets: 'Meets',
            good: 'Good',
            very_good: 'Very Good',
            exceptional: 'Exceptional',
        };

    // Get the display name for the current score level
    const getLevelDisplayName = () => {
        if (scoreLevels.length === 0) {
            return levelLabelsEn[score.level] || score.level;
        }
        // Find the level that matches the current score
        for (let i = scoreLevels.length - 1; i >= 0; i--) {
            if (score.score >= scoreLevels[i].scoreValue) {
                return scoreLevels[i].name;
            }
        }
        return scoreLevels[0]?.name || score.level;
    };

    // Glow style based on score color
    const glowStyle = glow ? {
        filter: `drop-shadow(0 0 20px ${score.color}) drop-shadow(0 0 40px ${score.color}40)`,
    } : {};

    return (
        <div className={`flex flex-col items-center w-full ${compact ? 'gap-1' : ''}`}>
            {/* Title with icon - hidden in compact mode */}
            {!compact && (
                <div className="flex items-center gap-2 mb-3">
                    <div className="rounded-full bg-red-100 flex items-center justify-center w-6 h-6">
                        <svg className="text-red-600 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className={`font-bold text-slate-800 ${titleSize}`}>
                        Оценка
                    </span>
                </div>
            )}

            {/* Speedometer SVG */}
            <div className="relative" style={glowStyle}>
                <svg width={width} height={height} className="overflow-visible">
                    {/* Background arc segments */}
                    {scoreRanges.map((range, index) => (
                        <path
                            key={index}
                            d={createArcPath(range.start * 1.8, range.end * 1.8, radius)}
                            fill="none"
                            stroke={range.color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="butt"
                        />
                    ))}



                    {/* Tick marks - small inner ticks */}
                    {minorTicks.map((value) => {
                        const tickPct = ((value - minScore) / scoreRange) * 100;
                        const tickAngle = (180 - (tickPct / 100) * 180) * (Math.PI / 180);
                        const tickInner = radius - strokeWidth - 8;
                        const tickOuter = radius - strokeWidth + 2;

                        return (
                            <line
                                key={value}
                                x1={centerX + tickInner * Math.cos(tickAngle)}
                                y1={centerY - tickInner * Math.sin(tickAngle)}
                                x2={centerX + tickOuter * Math.cos(tickAngle)}
                                y2={centerY - tickOuter * Math.sin(tickAngle)}
                                stroke="#999"
                                strokeWidth={1.5}
                            />
                        );
                    })}

                    {/* Labels outside the arc */}
                    {labels.map((tick) => {
                        const tickPct = ((tick.value - minScore) / scoreRange) * 100;
                        const tickAngle = (180 - (tickPct / 100) * 180) * (Math.PI / 180);
                        const labelRadius = radius + 18;

                        return (
                            <text
                                key={tick.value}
                                x={centerX + labelRadius * Math.cos(tickAngle)}
                                y={centerY - labelRadius * Math.sin(tickAngle) + 5}
                                textAnchor="middle"
                                fontSize={labelFontSize}
                                fontWeight="700"
                                fill="#1e293b"
                            >
                                {tick.label}
                            </text>
                        );
                    })}

                    {/* Needle - thicker and darker */}
                    <line
                        x1={centerX}
                        y1={centerY}
                        x2={needleX}
                        y2={needleY}
                        stroke="#000"
                        strokeWidth={size === 'lg' ? 5 : size === 'md' ? 4 : 3}
                        strokeLinecap="round"
                    />

                    {/* Needle center circle */}
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={size === 'lg' ? 10 : size === 'md' ? 8 : 6}
                        fill="#000"
                    />

                    {/* Score value below center */}
                    <text
                        x={centerX}
                        y={centerY + (size === 'lg' ? 50 : size === 'md' ? 40 : 32)}
                        textAnchor="middle"
                        fontSize={fontSize}
                        fontWeight="bold"
                        fill="#0f172a"
                    >
                        {score.score.toFixed(2)}
                    </text>
                </svg>
            </div>

            {/* Status badge */}
            {showLabel && (
                <div
                    className={`${compact ? 'mt-2 py-2 px-3' : 'mt-5 py-4 px-5'} w-full rounded-lg font-bold text-white shadow-lg`}
                    style={{
                        backgroundColor: score.color,
                        boxShadow: glow ? `0 4px 20px ${score.color}60` : undefined
                    }}
                >
                    <div className={`text-center font-bold tracking-wide ${compact ? 'text-sm' : 'text-base'}`}>
                        {getLevelDisplayName()}
                    </div>
                    <div className={`text-center mt-1 opacity-95 font-semibold ${compact ? 'text-xs' : 'text-sm mt-1.5'}`}>
                        {score.score.toFixed(2)} ({percentage.toFixed(1)}%)
                    </div>
                </div>
            )}
        </div>
    );
};

export default Speedometer;
