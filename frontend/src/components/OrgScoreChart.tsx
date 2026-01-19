import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { Department, ScoreResult } from '../types/okr';

interface OrgScoreChartProps {
    departments: Department[];
    overallScore: ScoreResult;
    height?: number;
}

const OrgScoreChart: React.FC<OrgScoreChartProps> = ({
    departments,
    overallScore,
    height = 180
}) => {
    // Create data points showing how each department contributes to the org score
    // This creates a visual flow from min to max with the org score highlighted
    const sortedDepts = [...departments]
        .filter(d => d.score)
        .sort((a, b) => (a.score?.score || 0) - (b.score?.score || 0));

    const data = sortedDepts.map((dept, index) => ({
        name: dept.name.length > 10 ? dept.name.substring(0, 10) + '...' : dept.name,
        fullName: dept.name,
        score: dept.score?.score || 0,
        orgScore: overallScore.score,
        color: dept.score?.color || '#666'
    }));

    // Add org average point at the end
    if (data.length > 0) {
        data.push({
            name: 'Org Avg',
            fullName: 'Organization Average',
            score: overallScore.score,
            orgScore: overallScore.score,
            color: overallScore.color
        });
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-lg text-xs">
                    <p className="font-bold text-slate-700">{d.fullName}</p>
                    <p className="mt-1">
                        Score: <span className="font-bold" style={{ color: d.color }}>{d.score.toFixed(2)}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (departments.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="orgScoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={overallScore.color} stopOpacity={0.6} />
                        <stop offset="95%" stopColor={overallScore.color} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                />
                <YAxis
                    domain={[3, 5]}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    ticks={[3, 3.5, 4, 4.5, 5]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                    y={overallScore.score}
                    stroke={overallScore.color}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                        value: `Org: ${overallScore.score.toFixed(2)}`,
                        position: 'right',
                        fontSize: 10,
                        fill: overallScore.color,
                        fontWeight: 'bold'
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="score"
                    stroke={overallScore.color}
                    strokeWidth={2}
                    fill="url(#orgScoreGradient)"
                    dot={{ fill: overallScore.color, strokeWidth: 2, r: 3, stroke: '#fff' }}
                    activeDot={{ r: 5, fill: overallScore.color, stroke: '#fff', strokeWidth: 2 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default OrgScoreChart;
