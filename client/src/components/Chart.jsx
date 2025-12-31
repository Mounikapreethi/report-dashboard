import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import useStore from '../store';

const Chart = () => {
    const { data, chartDimensions, setChartDimensions } = useStore();

    const dimensions = [
        { label: 'Status', value: 'status', path: (row) => row.json_payload?.meta?.status?.State },
        { label: 'State', value: 'state', path: (row) => row.json_payload?.data?.Submission?.Insured?.Address?.State },
        { label: 'Offering Type', value: 'offeringType', path: (row) => row.json_payload?.data?.Request?.Products?.MguOfferingType },
        { label: 'Premium', value: 'premium', path: (row) => row.json_payload?.data?.Request?.TotalPremium }
    ];

    const COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    const toggleDimension = (val) => {
        if (chartDimensions.includes(val)) {
            setChartDimensions(chartDimensions.filter(d => d !== val));
        } else {
            if (chartDimensions.length < 2) {
                setChartDimensions([...chartDimensions, val]);
            }
        }
    };

    const prepareData = () => {
        if (chartDimensions.length === 0) return [];

        if (chartDimensions.length === 1) {
            const dim = dimensions.find(d => d.value === chartDimensions[0]);
            const counts = data.reduce((acc, row) => {
                const val = dim.path(row) || 'Unknown';
                acc[val] = (acc[val] || 0) + 1;
                return acc;
            }, {});
            return Object.entries(counts).map(([name, value]) => ({ name, value }));
        }

        if (chartDimensions.length === 2) {
            const dim1 = dimensions.find(d => d.value === chartDimensions[0]);
            const dim2 = dimensions.find(d => d.value === chartDimensions[1]);

            // Collect all unique v2 keys first to ensure we have a bar for each
            const v2Keys = [...new Set(data.map(row => dim2.path(row) || 'Unknown'))].sort();

            const grouped = data.reduce((acc, row) => {
                const v1 = dim1.path(row) || 'Unknown';
                const v2 = dim2.path(row) || 'Unknown';
                if (!acc[v1]) acc[v1] = { name: v1 };
                acc[v1][v2] = (acc[v1][v2] || 0) + 1;
                return acc;
            }, {});

            return Object.values(grouped);
        }
    };

    const chartData = prepareData();
    const getBarKeys = () => {
        if (chartDimensions.length !== 2 || chartData.length === 0) return [];
        // Get all unique keys across all data points, excluding 'name'
        const keys = new Set();
        chartData.forEach(item => {
            Object.keys(item).forEach(k => {
                if (k !== 'name') keys.add(k);
            });
        });
        return Array.from(keys).sort();
    };

    return (
        <div className="chart-container">
            <div className="chart-header">
                <div className="dimension-selectors">
                    {dimensions.map(dim => (
                        <button
                            key={dim.value}
                            className={`dim-btn ${chartDimensions.includes(dim.value) ? 'active' : ''}`}
                            onClick={() => toggleDimension(dim.value)}
                        >
                            {dim.label}
                        </button>
                    ))}
                </div>
                <div className="chart-info">
                    {chartDimensions.length === 1 ? 'Pie Chart View' : 'Bar Chart View (Comparison)'}
                </div>
            </div>
            <div className="chart-content" style={{ height: 300, width: '100%' }}>
                {chartData.length === 0 ? <div className="no-data">Select dimensions to view chart</div> : (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartDimensions.length === 1 ? (
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%" cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name }) => name}
                                >
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        ) : (
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: 'none' }} />
                                {getBarKeys().map((key, idx) => (
                                    <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} stackId="a" />
                                ))}
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default Chart;
