import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Brush,
    ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Development, Investment } from '../types/api';
import { developmentsToChartPoints } from '../types/ui';
import { formatCurrency, formatDate } from '../utils/formatting';
import { filterDevelopmentsByDate } from '../utils/portfolioTransformations';

interface PerformanceChartProps {
    developments: Development[];
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    investments: Investment[];
    totalsName: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ developments, dateRange, investments, totalsName = "" }) => {
    const theme = useTheme();

    // Track which series is focused (clicked)
    const [focusedKey, setFocusedKey] = useState<string | null>(null);

    const handleLegendClick = (e: any) => {
        const key = e.dataKey?.toString() ?? '';
        setFocusedKey(prev => (prev === key ? null : key));
    };

    const assetIds = investments.map(inv => inv.id);
    const idToShortname = Object.fromEntries(investments.map(inv => [inv.id, inv.shortname]));
    const filteredData = filterDevelopmentsByDate(developments, dateRange.startDate, dateRange.endDate);
    const chartData = developmentsToChartPoints(filteredData);
    const maxValue = Math.max(...chartData.map(data => Math.max(...assetIds.map(assetId => data[assetId] as number || 0))));
    console.log("dateRange", dateRange);
    console.log("developments", developments);
    console.log("chartData", chartData);
    console.log("assetIds", assetIds);
    console.log("idToShortname", idToShortname);

    const colorScale = [
        '#1f77b4', '#ff7f0e', '#2ca02c',
        '#d62728', '#9467bd', '#8c564b',
        '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];

    return (
        <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="date"
                    tickFormatter={(value: Date) => formatDate(value)}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    tickFormatter={(value: number) => formatCurrency(value || 0)}
                    tick={{ fontSize: 12 }}
                    domain={[0, maxValue + 1000]}
                />
                <Brush
                    dataKey="date"
                    height={30}
                    stroke={theme.palette.primary.main}
                    tickFormatter={(value: Date) => formatDate(value)}
                />
                <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(value: Date) => formatDate(value)}
                />
                <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
                {/* Total portfolio line */}
                {totalsName !== "" && (
                    <Area
                        type="linear"
                        dataKey="sum"
                        hide={focusedKey !== null && focusedKey !== 'sum'}
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={true}
                        name={totalsName}
                    />
                )}
                {/* Individual asset lines */}
                {assetIds.map((assetId, index) => (
                    <Area
                        key={assetId}
                        type="linear"
                        dataKey={assetId}
                        hide={focusedKey !== null && String(assetId) !== focusedKey}
                        stroke={colorScale[index % 10]}
                        fill={colorScale[index % 10]}
                        stackId="1"
                        strokeWidth={1}
                        dot={false}
                        name={idToShortname[assetId] || assetId.toString()}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default PerformanceChart;