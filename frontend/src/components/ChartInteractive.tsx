"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [viewMode, setViewMode] = useState<'absolute' | 'relative'>('absolute');
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
            case 'dynamic_alpha': return ["Dynamic Sector Alpha", "Sector Baseline"];
            case 'horizon_parity': return ["Sector Baseline", "Sector Baseline"];
            case 'mag7_multiscale': return ["Mag 7 Multiscale", "Mag 7 Risk Parity"];
            case 'mag7_riskparity': return ["Mag 7 Risk Parity", "Mag 7 Risk Parity"];
            case 'quality_factor': return ["S&P 500 Quality Factor", "S&P 500 Quality Factor"];
            default: return ["Target Strategy", "Baseline"];
        }
    };
    const [targetName, baseName] = getNames();

    return (
        <div className="bg-slate-900/40 border border-slate-700/50 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl w-full h-full flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="mb-6 relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-display font-bold text-white tracking-tight">
                        {viewMode === 'absolute' ? 'Cumulative Performance' : 'Cumulative Relative Performance'}
                    </h3>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'absolute' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setViewMode('absolute')}
                        >
                            Absolute
                        </button>
                        <button
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'relative' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setViewMode('relative')}
                        >
                            Relative
                        </button>
                    </div>
                </div>

                {/* Advanced Institutional Metrics Layout */}
                {metrics && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 bg-slate-950/50 p-3 md:p-4 rounded-xl border border-slate-800/80"
                    >
                        {/* Mobile: compact 3x3 grid, Desktop: 3 column with dividers */}
                        <div className="grid grid-cols-3 md:grid-cols-3 gap-x-2 gap-y-3 md:gap-6 md:divide-x divide-slate-800/60">
                            {/* Risk-Adjusted */}
                            <div className="col-span-3 md:col-span-1 md:pl-0">
                                <h4 className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> Risk-Adjusted
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">Sharpe</p>
                                        <p className="text-base md:text-lg font-black text-slate-100">{metrics.sharpe.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">Sortino</p>
                                        <p className={`text-base md:text-lg font-black ${metrics.sortino >= 1.0 ? 'text-emerald-400' : 'text-slate-100'}`}>{metrics.sortino.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">Calmar</p>
                                        <p className={`text-base md:text-lg font-black ${metrics.calmar >= 0.5 ? 'text-emerald-400' : 'text-slate-100'}`}>{metrics.calmar.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Border separator on mobile */}
                            <div className="col-span-3 border-t border-slate-800/60 md:hidden"></div>
                            {/* Relative Profile */}
                            <div className="col-span-3 md:col-span-1 md:pl-6">
                                <h4 className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></span> Relative
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">Info Ratio</p>
                                        <p className={`text-base md:text-lg font-black ${metrics.information_ratio >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>
                                            {metrics.information_ratio.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">Alpha</p>
                                        <p className={`text-base md:text-lg font-black ${metrics.alpha_pct >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>
                                            {metrics.alpha_pct > 0 ? '+' : ''}{metrics.alpha_pct.toFixed(2)}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">Beta</p>
                                        <p className="text-base md:text-lg font-black text-slate-300">{metrics.beta.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Border separator on mobile */}
                            <div className="col-span-3 border-t border-slate-800/60 md:hidden"></div>
                            {/* Stress */}
                            <div className="col-span-3 md:col-span-1 md:pl-6">
                                <h4 className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span> Stress
                                </h4>
                                <div>
                                    <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">Max DD Duration</p>
                                    <p className="text-base md:text-lg font-black text-slate-300">
                                        {metrics.max_dd_duration} <span className="text-xs text-slate-500 font-medium">Days</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="flex-1 min-h-[260px] md:min-h-[380px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            tick={{ fontSize: 12 }}
                            minTickGap={60}
                            tickFormatter={(val) => val.split("-")[0]}
                        />
                        <YAxis
                            stroke="#64748b"
                            tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                            domain={['auto', 'auto']}
                            width={60}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                            itemStyle={{ fontWeight: 'bold' }}
                            formatter={(value: number, name: string) => [`${(value * 100).toFixed(2)}%`, name]}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}
                        />
                        <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }} />

                        {/* The AI Strategy Line */}
                        {viewMode === 'absolute' && (
                            <Line
                                type="monotone"
                                dataKey="STGT"
                                name={targetName}
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
                            />
                        )}

                        {/* The Baseline Line */}
                        {viewMode === 'absolute' && (
                            <Line
                                type="monotone"
                                dataKey="Baseline"
                                name={baseName}
                                stroke="#64748b"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                            />
                        )}

                        {/* Relative Performance Line */}
                        {viewMode === 'relative' && (
                            <Line
                                type="monotone"
                                dataKey="Relative"
                                name="Relative Outperformance vs Baseline"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6, fill: '#8b5cf6', strokeWidth: 0 }}
                            />
                        )}

                        {/* The Interactive Zoom Slider */}
                        <Brush
                            dataKey="date"
                            height={30}
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
