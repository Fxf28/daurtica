// components/dashboard-charts.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ChartDataItem {
    label?: string;
    count?: number;
    value?: number;
    fill?: string;
    [key: string]: string | number | undefined;
}

export function DashboardBarChart({ data }: { data: ChartDataItem[] }) {
    return (
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                        dataKey="label"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip
                        formatter={(value) => [`${value} kali`, 'Jumlah']}
                        labelFormatter={(label) => `Jenis: ${label}`}
                    />
                    <Bar
                        dataKey="count"
                        fill="hsl(217, 91%, 60%)"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function DashboardPieChart({ data }: { data: ChartDataItem[] }) {
    return (
        <div className="h-80">
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} kali`, 'Jumlah']} />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    Belum ada data untuk ditampilkan
                </div>
            )}
        </div>
    );
}