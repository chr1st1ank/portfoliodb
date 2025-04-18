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
import { PerformanceData } from '../types/portfolio';
import { Investment } from '../services/api';

interface PerformanceChartProps {
    data: PerformanceData[];
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    investments: Investment[];
}


const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, dateRange, investments }) => {
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

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    };

    // Filter data based on date range
    const getFilteredData = () => {
        return data.filter(d => {
            const date = new Date(d.date);
            return date >= dateRange.startDate && date <= dateRange.endDate;
        });
    };

    const chartData = getFilteredData();

    // Get unique asset IDs from the data
    const assetIds = Array.from(new Set(data.flatMap(d => Object.keys(d).filter(key => key !== 'date' && key !== 'value'))));

    // Create a map of ISIN to shortname
    const isinToShortname = investments.reduce((acc, investment) => {
        acc[investment.isin] = (investment as any).shortname || (investment as any).shortName;
        return acc;
    }, {} as Record<string, string>);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12 }}
                />
                <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={formatDate}
                />
                <Legend />
                {/* Total portfolio line */}
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={false}
                    name="Gesamtportfolio"
                />
                {/* Individual asset lines */}
                {assetIds.map((assetId, index) => (
                    <Line
                        key={assetId}
                        type="monotone"
                        dataKey={assetId}
                        stroke={getAssetColor(index)}
                        strokeWidth={1}
                        dot={false}
                        name={isinToShortname[assetId] || assetId}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default PerformanceChart; 