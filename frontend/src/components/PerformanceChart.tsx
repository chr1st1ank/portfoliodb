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
import { PerformanceData } from '../types/portfolio';

interface PerformanceChartProps {
    data: PerformanceData;
    timeRange: '1M' | '3M' | '6M' | '1Y' | 'ALL';
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, timeRange }) => {
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('de-DE');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    };

    const getFilteredData = () => {
        const now = Date.now();
        let cutoffDate = now;

        switch (timeRange) {
            case '1M':
                cutoffDate = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case '3M':
                cutoffDate = now - 90 * 24 * 60 * 60 * 1000;
                break;
            case '6M':
                cutoffDate = now - 180 * 24 * 60 * 60 * 1000;
                break;
            case '1Y':
                cutoffDate = now - 365 * 24 * 60 * 60 * 1000;
                break;
            case 'ALL':
                return data.total;
        }

        return data.total.filter((point) => point.date >= cutoffDate);
    };

    const chartData = getFilteredData();

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
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
                    dataKey="value"
                    name="Portfolio Value"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default PerformanceChart; 