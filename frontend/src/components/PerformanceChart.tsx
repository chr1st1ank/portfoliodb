import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
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

const PerformanceChart: React.FC<PerformanceChartProps> = ({ developments, dateRange, investments, totalsName="" }) => {
    const theme = useTheme();

    // Generate a color palette for up to 50 assets
    const generateAssetColors = (count: number) => {
        const colors = [];
        const baseColors = [
            theme.palette.primary.main,
            theme.palette.success.main,
            theme.palette.error.main,
            theme.palette.warning.main,
            theme.palette.info.main,
        ];

        // Generate variations of each base color
        for (let i = 0; i < count; i++) {
            const baseColor = baseColors[i % baseColors.length];
            const variation = Math.floor(i / baseColors.length);
            const lightness = 0.7 + (variation * 0.1); // Adjust lightness for each variation
            colors.push(adjustColorLightness(baseColor, lightness));
        }

        return colors;
    };

    // Helper function to adjust color lightness
    const adjustColorLightness = (hex: string, lightness: number) => {
        // Convert hex to RGB
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);

        // Adjust lightness
        r = Math.min(255, Math.round(r * lightness));
        g = Math.min(255, Math.round(g * lightness));
        b = Math.min(255, Math.round(b * lightness));

        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    // Get color for an asset based on its index
    const getAssetColor = (index: number) => {
        const assetColors = generateAssetColors(50);
        return assetColors[index % 50];
    };

    const assetIds = investments.map(inv => inv.id);
    const idToShortname = Object.fromEntries(investments.map(inv => [inv.id, inv.shortname]));
    const filteredData =filterDevelopmentsByDate(developments, dateRange.startDate, dateRange.endDate);
    const chartData = developmentsToChartPoints(filteredData);
    const maxValue = Math.max(...chartData.map(data => Math.max(...assetIds.map(assetId => data[assetId] as number || 0))));
    console.log("dateRange", dateRange);
    console.log("developments", developments);
    console.log("chartData", chartData);
    console.log("assetIds", assetIds);
    console.log("idToShortname", idToShortname);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(value: Date) => formatDate(value)}
                />
                <Legend />
                {/* Total portfolio line */}
                {totalsName !== "" && (
                    <Line
                        type="monotone"
                        dataKey="sum"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={false}
                        name={totalsName}
                    />
                )}
                {/* Individual asset lines */}
                {assetIds.map((assetId, index) => (
                    <Line
                        key={assetId}
                        type="monotone"
                        dataKey={assetId}
                        stroke={getAssetColor(index)}
                        strokeWidth={1}
                        dot={false}
                        name={idToShortname[assetId] || assetId.toString()}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default PerformanceChart;