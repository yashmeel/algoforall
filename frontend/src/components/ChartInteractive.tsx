"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend } from 'recharts';

interface TimeSeriesPoint {
    date: string;
    STGT: number;
    Baseline: number;
    Relative: number;
}

interface AdvancedMetrics {
    sharpe: number;
    sortino: number;
    calmar: number;
    information_ratio: number;
    alpha_pct: number;
    beta: number;
    max_dd_duration: number;
}

export default function ChartInteractive({ strategyId = 'dynamic_alpha' }) {
    const [data, setData] = useState<TimeSeriesPoint[]>([]);
    const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurve = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/backtest/equity-curve/${strategyId}`);
                const result = await response.json();
                setData(result.timeseries || []);
                setMetrics(result.metrics || null);
            } catch (error) {
                console.error("Failed to fetch equity curve:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCurve();
    }, [strategyId]);

    if (loading) return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl w-full h-full flex items-center justify-center">
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-emerald-500 font-semibold tracking-wide flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                Querying STGT Model History...
            </motion.div>
        </div>
    );

    const getNames = () => {
        switch (strategyId) {
            case 'sector_rotation': return ["Multiscale Sector Rotation", "Risk Parity Baseline"];
            case 'large_cap_100':   return ["Multiscale Large Cap 100",   "Risk Parity Baseline"];
            case 'mag7_momentum':   return ["Multiscale Mag 7",           "Risk Parity Baseline"];
            case 'stgt_ensemble':   return ["STGT Ensemble",              "Sector Rotation"];
            case 'risk_parity':     return ["Multi-Horizon Risk Parity",  "Risk Parity Baseline"];
            case 'quality_factor':  return ["S&P 500 Quality",            "Risk Parity Baseline"];
            default:                return ["Strategy", "Baseline"];
        }
    };
    const [targetName, baseName] = getNames();

    // Smart Y-axis: convert decimal to readable % with auto range
    const formatYAxis = (val: number) => {
        const pct = val * 100;
        if (Math.abs(pct) >= 1000) return `${(pct / 1000).toFixed(1)}k%`;
        return `${pct.toFixed(0)}%`;
    };

    return (
        <div className="bg-slate-900/40 border border-slate-700/50 backdrop-blur-2xl rounded-2xl p-4 md:p-6 shadow-2xl w-full h-full flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            {/* Header */}
            <div className="mb-4 relative z-10">
                <h3 className="text-lg md:text-xl font-display font-bold text-white tracking-tight mb-3">
                    Cumulative Performance
                </h3>

                {/* Metrics strip — single row, 7 items, no overflow */}
                {metrics && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-4 sm:grid-cols-7 gap-px bg-slate-800/60 rounded-xl overflow-hidden border border-slate-800/60"
                    >
                        {[
                            { label: 'Sharpe (Rf=4%)', value: metrics.sharpe.toFixed(2), color: metrics.sharpe >= 1 ? 'text-emerald-400' : 'text-slate-100' },
                            { label: 'Sortino (Rf=4%)', value: metrics.sortino.toFixed(2), color: metrics.sortino >= 1 ? 'text-emerald-400' : 'text-slate-100' },
                            { label: 'Calmar', value: metrics.calmar.toFixed(2), color: metrics.calmar >= 0.5 ? 'text-emerald-400' : 'text-slate-100' },
                            { label: 'Info Ratio', value: metrics.information_ratio.toFixed(2), color: metrics.information_ratio >= 0 ? 'text-violet-400' : 'text-rose-400' },
                            { label: 'Alpha', value: `${metrics.alpha_pct > 0 ? '+' : ''}${metrics.alpha_pct.toFixed(1)}%`, color: metrics.alpha_pct >= 0 ? 'text-violet-400' : 'text-rose-400' },
                            { label: 'Beta', value: metrics.beta.toFixed(2), color: 'text-slate-200' },
                            { label: 'DD Days', value: `${metrics.max_dd_duration}d`, color: 'text-rose-300' },
                        ].map((m, i) => (
                            <div key={i} className="bg-slate-950/60 px-2 py-2 flex flex-col items-center justify-center text-center">
                                <p className="text-[0.55rem] uppercase text-slate-500 font-bold tracking-wider leading-none mb-1 whitespace-nowrap">{m.label}</p>
                                <p className={`text-xs sm:text-sm font-black leading-none ${m.color}`}>{m.value}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-[260px] md:min-h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            tick={{ fontSize: 11 }}
                            minTickGap={60}
                            tickFormatter={(val) => val.split("-")[0]}
                        />
                        <YAxis
                            stroke="#64748b"
                            tick={{ fontSize: 11 }}
                            tickFormatter={formatYAxis}
                            domain={['auto', 'auto']}
                            width={52}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                            itemStyle={{ fontWeight: 'bold' }}
                            formatter={(value: number, name: string) => [`${(value * 100).toFixed(2)}%`, name]}
                            labelStyle={{ color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '600', color: '#cbd5e1' }} />

                        <Line
                            type="monotone"
                            dataKey="STGT"
                            name={targetName}
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="Baseline"
                            name={baseName}
                            stroke="#64748b"
                            strokeWidth={1.5}
                            strokeDasharray="5 5"
                            dot={false}
                        />

                        <Brush
                            dataKey="date"
                            height={24}
                            stroke="#334155"
                            fill="#0f172a"
                            tickFormatter={() => ''}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
