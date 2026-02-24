"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';

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

export type Period = '5y' | '10y' | 'max';

interface Props {
    strategyId?: string;
    period: Period;
    onPeriodChange: (p: Period) => void;
}

export default function ChartInteractive({
    strategyId = 'sector_rotation',
    period,
    onPeriodChange,
}: Props) {
    const [allData, setAllData] = useState<TimeSeriesPoint[]>([]);
    const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurve = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/backtest/equity-curve/${strategyId}`
                );
                const result = await response.json();
                setAllData(result.timeseries || []);
                setMetrics(result.metrics || null);
            } catch (error) {
                console.error('Failed to fetch equity curve:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCurve();
    }, [strategyId]);

    // Slice data to selected period and rebase to 0% at period start
    const data = useMemo(() => {
        if (!allData.length) return [];
        if (period === 'max') return allData;
        const yearsBack = period === '5y' ? 5 : 10;
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - yearsBack);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        const sliced = allData.filter(d => d.date >= cutoffStr);
        if (!sliced.length) return [];
        // Rebase: divide by first-point value so both series start at 0%
        const b0  = 1 + sliced[0].STGT;
        const bl0 = 1 + sliced[0].Baseline;
        return sliced.map(d => ({
            ...d,
            STGT:     (1 + d.STGT)     / b0  - 1,
            Baseline: (1 + d.Baseline) / bl0 - 1,
        }));
    }, [allData, period]);

    const getNames = (): [string, string] => {
        switch (strategyId) {
            case 'sector_rotation': return ['Multiscale Sector Rotation', 'Risk Parity Baseline'];
            case 'large_cap_100':   return ['Multiscale Large Cap 100',   'Risk Parity Baseline'];
            case 'mag7_momentum':   return ['Multiscale Mag 7',           'Risk Parity Baseline'];
            case 'stgt_ensemble':   return ['STGT Ensemble',              'Sector Rotation'];
            case 'risk_parity':     return ['Multi-Horizon Risk Parity',  'Risk Parity Baseline'];
            case 'quality_factor':  return ['S&P 500 Quality',            'Risk Parity Baseline'];
            default:                return ['Strategy', 'Baseline'];
        }
    };
    const [targetName, baseName] = getNames();

    // Values are cumulative multipliers (e.g. 37.99 = 3799% total gain)
    const formatYAxis = (val: number) => {
        const pct = val * 100;
        if (Math.abs(pct) >= 10000) return `${(pct / 1000).toFixed(0)}k%`;
        if (Math.abs(pct) >= 1000)  return `${(pct / 1000).toFixed(1)}k%`;
        return `${pct.toFixed(0)}%`;
    };

    const PERIODS: { key: Period; label: string }[] = [
        { key: '5y',  label: '5Y'  },
        { key: '10y', label: '10Y' },
        { key: 'max', label: 'MAX' },
    ];

    return (
        // h-full inherits explicit height from parent (page.tsx sets h-[460px])
        // flex flex-col so header stays fixed-height and chart takes the rest
        <div className="bg-slate-900/40 border border-slate-700/50 backdrop-blur-2xl rounded-2xl p-4 md:p-5 shadow-2xl w-full h-full flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            {/* Header: title + period toggle */}
            <div className="flex-shrink-0 mb-3 relative z-10">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <h3 className="text-base md:text-lg font-display font-bold text-white tracking-tight">
                        Cumulative Performance
                    </h3>
                    {/* Period toggle pills */}
                    <div className="flex gap-1 bg-slate-800/60 rounded-lg p-0.5 border border-slate-700/50">
                        {PERIODS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => onPeriodChange(key)}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 ${
                                    period === key
                                        ? 'bg-emerald-500/25 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/40'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Metrics strip — full-history stats */}
                {metrics && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-4 sm:grid-cols-7 gap-px bg-slate-800/60 rounded-xl overflow-hidden border border-slate-800/60"
                    >
                        {[
                            { label: 'Sharpe',     value: metrics.sharpe.toFixed(2),           color: metrics.sharpe >= 1 ? 'text-emerald-400' : 'text-slate-100' },
                            { label: 'Sortino',    value: metrics.sortino.toFixed(2),           color: metrics.sortino >= 1 ? 'text-emerald-400' : 'text-slate-100' },
                            { label: 'Calmar',     value: metrics.calmar.toFixed(2),            color: metrics.calmar >= 0.5 ? 'text-emerald-400' : 'text-slate-100' },
                            { label: 'Info Ratio', value: metrics.information_ratio.toFixed(2), color: metrics.information_ratio >= 0 ? 'text-violet-400' : 'text-rose-400' },
                            { label: 'Alpha',      value: `${metrics.alpha_pct > 0 ? '+' : ''}${metrics.alpha_pct.toFixed(1)}%`, color: metrics.alpha_pct >= 0 ? 'text-violet-400' : 'text-rose-400' },
                            { label: 'Beta',       value: metrics.beta.toFixed(2),              color: 'text-slate-200' },
                            { label: 'DD Days',    value: `${metrics.max_dd_duration}d`,        color: 'text-rose-300' },
                        ].map((m, i) => (
                            <div key={i} className="bg-slate-950/60 px-2 py-2 flex flex-col items-center justify-center text-center">
                                <p className="text-[0.5rem] uppercase text-slate-500 font-bold tracking-wider leading-none mb-1 whitespace-nowrap">{m.label}</p>
                                <p className={`text-xs font-black leading-none ${m.color}`}>{m.value}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Chart — flex-1 + min-h-0 is the CRITICAL fix.
                min-h-0 overrides default min-height:auto on flex items,
                allowing ResponsiveContainer to measure real pixel height. */}
            <div className="flex-1 min-h-0 w-full">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-emerald-500 font-semibold flex items-center gap-3"
                        >
                            <div className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                            Loading chart data...
                        </motion.div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                        No data for {period.toUpperCase()} window
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                tick={{ fontSize: 10 }}
                                minTickGap={50}
                                tickFormatter={(val: string) => val.slice(0, 4)}
                            />
                            <YAxis
                                stroke="#64748b"
                                tick={{ fontSize: 10 }}
                                tickFormatter={formatYAxis}
                                domain={['auto', 'auto']}
                                width={58}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    borderColor: '#1e293b',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                                    fontSize: '12px',
                                }}
                                formatter={(value: number, name: string) => [
                                    `${(value * 100).toFixed(1)}%`, name
                                ]}
                                labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={28}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '11px', fontWeight: '600', color: '#cbd5e1' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="STGT"
                                name={targetName}
                                stroke="#10b981"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
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
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
