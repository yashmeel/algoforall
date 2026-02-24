"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProjectionProps {
    stgtMetrics: { cagr: number; volatility: number };
    baseMetrics: { cagr: number; volatility: number };
}

export default function ProjectionCalc({ stgtMetrics, baseMetrics }: ProjectionProps) {
    const [initialInvest, setInitialInvest] = useState(100000);
    const [monthlyContrib, setMonthlyContrib] = useState(1000);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSimulation = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/simulation/simulate`, {
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

        // Debounce the fetch slightly to avoid spamming the backend on slider drag
        const timer = setTimeout(() => {
            fetchSimulation();
        }, 300);
        return () => clearTimeout(timer);
    }, [initialInvest, monthlyContrib, stgtMetrics.cagr, stgtMetrics.volatility, baseMetrics.cagr, baseMetrics.volatility]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-2xl">
            <div className="mb-4 md:mb-6 border-b border-slate-800 pb-3 md:pb-4">
                <h3 className="text-base md:text-xl font-bold text-white">10-Year Wealth Projection</h3>
                <p className="text-xs text-slate-400 mt-1 hidden sm:block">
                    Dual 1,000-path Monte Carlo distribution (STGT vs Baseline).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-8">
                <div className="md:col-span-1 space-y-4 md:space-y-6">
                    <div>
                        <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5 md:mb-2">
                            Initial Investment: ${initialInvest.toLocaleString()}
                        </label>
                        <input
                            type="range"
                            min="10000"
                            max="1000000"
                            step="10000"
                            value={initialInvest}
                            onChange={(e) => setInitialInvest(Number(e.target.value))}
                            className="w-full accent-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5 md:mb-2">
                            Monthly Contribution: ${monthlyContrib.toLocaleString()}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="20000"
                            step="500"
                            value={monthlyContrib}
                            onChange={(e) => setMonthlyContrib(Number(e.target.value))}
                            className="w-full accent-emerald-500"
                        />
                    </div>

                    <div className="bg-slate-950 p-3 md:p-4 rounded-lg border border-slate-800">
                        <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2 md:mb-3">Model Parameters</h4>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <h5 className="text-[10px] text-emerald-500 uppercase font-bold mb-1 tracking-wider border-b border-emerald-900/50 pb-1">STGT</h5>
                                <div className="text-xs text-slate-300">CAGR: <span className="text-white font-bold">{stgtMetrics.cagr}%</span></div>
                                <div className="text-xs text-slate-400">Vol: {stgtMetrics.volatility}%</div>
                            </div>
                            <div>
                                <h5 className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider border-b border-slate-800 pb-1">Baseline</h5>
                                <div className="text-xs text-slate-300">CAGR: <span className="text-white font-bold">{baseMetrics.cagr}%</span></div>
                                <div className="text-xs text-slate-400">Vol: {baseMetrics.volatility}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 h-[260px] sm:h-[320px] md:h-[350px] relative">
                    {loading && (
                        <div className="absolute inset-0 z-10 bg-slate-900/50 flex items-center justify-center">
                            <span className="text-emerald-500 animate-pulse font-semibold">Simulating 2,000 paths...</span>
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#475569" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="month" stroke="#64748b" tickFormatter={(val) => `Yr ${Math.floor(val / 12)}`} />
                            <YAxis
                                stroke="#64748b"
                                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                width={80}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                itemStyle={{ fontWeight: 'bold' }}
                                formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)}
                                labelFormatter={(label) => `Month ${label}`}
                            />

                            {/* Baseline Simulation Layers */}
                            <Area type="monotone" dataKey="base_optimistic" name="Base 90th" stroke="#64748b" fillOpacity={1} fill="url(#colorBase)" strokeDasharray="5 5" />
                            <Area type="monotone" dataKey="base_expected" name="Base Expected" stroke="#94a3b8" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                            <Area type="monotone" dataKey="base_pessimistic" name="Base 10th" stroke="#475569" fillOpacity={1} fill="url(#colorBase)" strokeDasharray="5 5" />

                            {/* STGT Primary Simulation Layers */}
                            <Area type="monotone" dataKey="optimistic" name="STGT 90th" stroke="#34d399" fillOpacity={1} fill="url(#colorOpt)" />
                            <Area type="monotone" dataKey="expected" name="STGT Expected" stroke="#60a5fa" strokeWidth={3} fill="none" />
                            <Area type="monotone" dataKey="pessimistic" name="STGT 10th" stroke="#f43f5e" fillOpacity={1} fill="url(#colorPes)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
