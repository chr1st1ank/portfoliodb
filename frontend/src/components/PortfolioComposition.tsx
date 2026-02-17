import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { PortfolioData } from '../types/portfolio';

interface PortfolioCompositionProps {
    data: PortfolioData;
}

const PortfolioComposition: React.FC<PortfolioCompositionProps> = ({ data }) => {
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    };

    // Prepare pie chart data with proper asset names
    const pieData = data.investments.map((investment, index) => {
        return {
            name: investment.shortname,
            fullName: investment.name,
            value: investment.valueAfter,
            color: getAssetColor(index),
        };
    });

    // Calculate total value for percentage calculation
    const totalValue = pieData.reduce((sum, item) => sum + item.value, 0);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <PieChart>
                <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => {
                        const percentage = (value / totalValue) * 100;
                        return `${name} (${percentage.toFixed(1)}%)`;
                    }}
                >
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                        formatCurrency(value),
                        `${((value / totalValue) * 100).toFixed(1)}%`,
                        props.payload.fullName
                    ]}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default PortfolioComposition; 