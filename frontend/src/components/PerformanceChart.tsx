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

interface PerformanceChartProps {
    data: PerformanceData;
    timeRange: '1M' | '3M' | '6M' | '1Y' | 'ALL';
}

const ASSET_NAMES = {
    'DE000A0F5UF5': 'MSCI World',
    'IE00B4L5Y983': 'MSCI EM',
    'DE000A0F5UH1': 'MSCI Europe',
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, timeRange }) => {
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

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    };

    // Filter data based on time range
    const now = new Date().getTime();
    const filterData = (dataPoints: { date: number; value: number }[]) => {
        if (timeRange === 'ALL') {
            return dataPoints;
        }

        const msInMonth = 30 * 24 * 60 * 60 * 1000;
        const cutoff = now - (
            timeRange === '1M' ? msInMonth :
                timeRange === '3M' ? 3 * msInMonth :
                    timeRange === '6M' ? 6 * msInMonth :
                        12 * msInMonth // 1Y
        );
        return dataPoints.filter(point => point.date >= cutoff);
    };

    // Prepare chart data
    const chartData = filterData(data.total).map(totalPoint => {
        const point: any = {
            date: totalPoint.date,
            Total: totalPoint.value,
        };

        // Add individual asset values for the same date
        Object.entries(data.investments).forEach(([isin, points]) => {
            const assetPoint = points.find(p => p.date === totalPoint.date);
            if (assetPoint) {
                point[ASSET_NAMES[isin as keyof typeof ASSET_NAMES]] = assetPoint.value;
            }
        });

        return point;
    });

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
                <Line
                    type="monotone"
                    dataKey="Total"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={false}
                    name="Gesamtportfolio"
                />
                {Object.entries(ASSET_NAMES).map(([isin, name], index) => (
                    <Line
                        key={isin}
                        type="monotone"
                        dataKey={name}
                        stroke={getAssetColor(index)}
                        strokeWidth={2}
                        dot={false}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default PerformanceChart; 