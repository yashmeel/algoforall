"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { API_URL } from '../lib/api';

interface ProjectionProps {
    stgtMetrics: { cagr: number; volatility: number };
    baseMetrics: { cagr: number; volatility: number };
}

interface ProjectionRow {
    month: number;
    optimistic: number;
    expected: number;
    pessimistic: number;
    base_optimistic: number;
    base_expected: number;
    base_pessimistic: number;
}

function formatDollars(val: number): string {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
    return `$${val.toFixed(0)}`;
}

export default function ProjectionCalc({ stgtMetrics, baseMetrics }: ProjectionProps) {
    const [initialInvest, setInitialInvest] = useState(100000);
    const [monthlyContrib, setMonthlyContrib] = useState(1000);
    const [chartData, setChartData] = useState<ProjectionRow[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSimulation = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/v1/simulation/simulate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        initial_investment: initialInvest,
                        monthly_contribution: monthlyContrib,
                        cagr: stgtMetrics.cagr,
                        volatility: stgtMetrics.volatility,
                        base_cagr: baseMetrics.cagr,
                        base_volatility: baseMetrics.volatility,
                        years: 10
                    })
                });
                const data = await res.json();
                setChartData(data.projection || []);
            } catch (e) {
                console.error("Failed Monte Carlo fetch");
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => { fetchSimulation(); }, 300);
        return () => clearTimeout(timer);
    }, [initialInvest, monthlyContrib, stgtMetrics.cagr, stgtMetrics.volatility, baseMetrics.cagr, baseMetrics.volatility]);

    // Pull final year stats from last data point
    const finalRow = chartData.length > 0 ? chartData[chartData.length - 1] : null;

    // Total invested over 10 years
    const totalInvested = initialInvest + (monthlyContrib * 120);

    // Stats derived from final row
    const stgtGain = finalRow ? finalRow.expected - totalInvested : 0;
    const stgtReturn = finalRow ? ((finalRow.expected - totalInvested) / totalInvested) * 100 : 0;
    const baseGain = finalRow ? finalRow.base_expected - totalInvested : 0;
    const baseReturn = finalRow ? ((finalRow.base_expected - totalInvested) / totalInvested) * 100 : 0;
    const outperformance = finalRow ? finalRow.expected - finalRow.base_expected : 0;

    // Y-axis domain: start from 0 or slightly below initialInvest to show context
    const allVals = chartData.flatMap(d => [d.optimistic, d.pessimistic, d.base_pessimistic, d.base_optimistic]).filter(Boolean);
    const maxVal = allVals.length ? Math.max(...allVals) : initialInvest * 3;

    const formatYAxis = (val: number) => {
        if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
        if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
        return `$${val}`;
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="border-b border-slate-800 pb-3 md:pb-4">
                <h3 className="text-base md:text-xl font-bold text-white">10-Year Wealth Projection</h3>
                <p className="text-xs text-slate-400 mt-1 hidden sm:block">
                    Dual 1,000-path Monte Carlo · 90th / Expected / 10th percentile
                </p>
            </div>

            {/* Controls + Chart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Sliders */}
                <div className="md:col-span-1 space-y-4">
                    <div>
                        <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
                            Initial Investment
                            <span className="ml-2 text-emerald-400 font-black">{formatDollars(initialInvest)}</span>
                        </label>
                        <input
                            type="range" min="10000" max="1000000" step="10000"
                            value={initialInvest}
                            onChange={(e) => setInitialInvest(Number(e.target.value))}
                            className="w-full accent-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
                            Monthly Contribution
                            <span className="ml-2 text-emerald-400 font-black">{formatDollars(monthlyContrib)}</span>
                        </label>
                        <input
                            type="range" min="0" max="20000" step="500"
                            value={monthlyContrib}
                            onChange={(e) => setMonthlyContrib(Number(e.target.value))}
                            className="w-full accent-emerald-500"
                        />
                    </div>

                    {/* Model params */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
                        <h4 className="text-[0.6rem] font-bold uppercase text-slate-500 tracking-widest">Model Parameters</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[0.6rem] text-emerald-500 uppercase font-bold tracking-wider border-b border-emerald-900/50 pb-0.5 mb-1">Strategy</p>
                                <p className="text-xs text-slate-300">CAGR: <span className="text-white font-bold">{stgtMetrics.cagr.toFixed(1)}%</span></p>
                                <p className="text-xs text-slate-400">Vol: {stgtMetrics.volatility.toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-[0.6rem] text-slate-500 uppercase font-bold tracking-wider border-b border-slate-800 pb-0.5 mb-1">Baseline</p>
                                <p className="text-xs text-slate-300">CAGR: <span className="text-white font-bold">{baseMetrics.cagr.toFixed(1)}%</span></p>
                                <p className="text-xs text-slate-400">Vol: {baseMetrics.volatility.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="border-t border-slate-800 pt-2">
                            <p className="text-[0.6rem] text-slate-500 uppercase font-bold tracking-widest">Total Invested</p>
                            <p className="text-sm font-black text-slate-200">{formatDollars(totalInvested)}</p>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="md:col-span-2 h-[260px] sm:h-[300px] md:h-[320px] relative">
                    {loading && (
                        <div className="absolute inset-0 z-10 bg-slate-900/70 flex items-center justify-center rounded-xl">
                            <span className="text-emerald-500 animate-pulse font-semibold text-sm">Simulating 2,000 paths...</span>
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#475569" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis
                                dataKey="month"
                                stroke="#64748b"
                                tick={{ fontSize: 11 }}
                                tickFormatter={(val) => val % 12 === 0 ? `Yr ${val / 12}` : ''}
                            />
                            <YAxis
                                stroke="#64748b"
                                tick={{ fontSize: 11 }}
                                tickFormatter={formatYAxis}
                                domain={[0, 'auto']}
                                width={64}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px' }}
                                itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                                formatter={(value: number) => [
                                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value),
                                    ''
                                ]}
                                labelFormatter={(label) => `Year ${Math.floor(Number(label) / 12)}`}
                            />

                            {/* Starting capital reference line */}
                            <ReferenceLine y={initialInvest} stroke="#334155" strokeDasharray="4 4" label={{ value: 'Start', position: 'right', fontSize: 10, fill: '#64748b' }} />

                            {/* Baseline bands */}
                            <Area type="monotone" dataKey="base_optimistic" name="Base 90th" stroke="#475569" strokeWidth={0} fillOpacity={1} fill="url(#colorBase)" strokeDasharray="4 4" legendType="none" />
                            <Area type="monotone" dataKey="base_expected" name="Baseline Expected" stroke="#64748b" strokeWidth={1.5} fill="none" strokeDasharray="5 5" />
                            <Area type="monotone" dataKey="base_pessimistic" name="Base 10th" stroke="#475569" strokeWidth={0} fillOpacity={1} fill="url(#colorBase)" strokeDasharray="4 4" legendType="none" />

                            {/* Strategy bands */}
                            <Area type="monotone" dataKey="optimistic" name="Strategy 90th" stroke="#34d399" strokeWidth={1} fillOpacity={1} fill="url(#colorOpt)" />
                            <Area type="monotone" dataKey="expected" name="Strategy Expected" stroke="#10b981" strokeWidth={2.5} fill="none" />
                            <Area type="monotone" dataKey="pessimistic" name="Strategy 10th" stroke="#f43f5e" strokeWidth={1} fillOpacity={1} fill="url(#colorPes)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 10-Year Return Summary */}
            {finalRow && (
                <div className="border-t border-slate-800 pt-4">
                    <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest mb-3">10-Year Projected Returns (Expected Path)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                        <div className="bg-slate-950/60 border border-emerald-900/40 rounded-xl p-3">
                            <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest mb-1">Strategy Value</p>
                            <p className="text-lg md:text-xl font-black text-emerald-400">{formatDollars(finalRow.expected)}</p>
                            <p className="text-[0.6rem] text-slate-500 mt-0.5">at 10 years</p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
                            <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest mb-1">Baseline Value</p>
                            <p className="text-lg md:text-xl font-black text-slate-300">{formatDollars(finalRow.base_expected)}</p>
                            <p className="text-[0.6rem] text-slate-500 mt-0.5">at 10 years</p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
                            <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest mb-1">Strategy Gain</p>
                            <p className={`text-lg md:text-xl font-black ${stgtGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {stgtGain >= 0 ? '+' : ''}{formatDollars(stgtGain)}
                            </p>
                            <p className="text-[0.6rem] text-slate-500 mt-0.5">+{stgtReturn.toFixed(1)}% on invested</p>
                        </div>
                        <div className="bg-slate-950/60 border border-violet-900/30 rounded-xl p-3">
                            <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest mb-1">Alpha Over Base</p>
                            <p className={`text-lg md:text-xl font-black ${outperformance >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>
                                {outperformance >= 0 ? '+' : ''}{formatDollars(outperformance)}
                            </p>
                            <p className="text-[0.6rem] text-slate-500 mt-0.5">additional wealth</p>
                        </div>
                    </div>

                    {/* Range stats */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3 flex justify-between items-center">
                            <div>
                                <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">Best Case (90th)</p>
                                <p className="text-base font-black text-emerald-300">{formatDollars(finalRow.optimistic)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">Worst Case (10th)</p>
                                <p className="text-base font-black text-rose-400">{formatDollars(finalRow.pessimistic)}</p>
                            </div>
                        </div>
                        <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3 flex justify-between items-center">
                            <div>
                                <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">Base Best (90th)</p>
                                <p className="text-base font-black text-slate-300">{formatDollars(finalRow.base_optimistic)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">Base Worst (10th)</p>
                                <p className="text-base font-black text-slate-500">{formatDollars(finalRow.base_pessimistic)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
