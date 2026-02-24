"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceStat {
    period: string;
    performance: number;
    volatility: number;
    is_annualized: boolean;
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

interface StrategyInfo {
    id: string;
    name: string;
    cagr: number;
    volatility: number;
    sharpe: number;
    max_dd: number;
    ytd: number;
}

interface Props {
    strategy: StrategyInfo;
}

function StatCell({ label, value, sub, color = 'text-slate-100' }: { label: string; value: string; sub?: string; color?: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest leading-none">{label}</p>
            <p className={`text-lg md:text-xl font-black leading-tight ${color}`}>{value}</p>
            {sub && <p className="text-[0.6rem] text-slate-600 leading-none">{sub}</p>}
        </div>
    );
}

export default function StrategyDetailPanel({ strategy }: Props) {
    const [perfData, setPerfData] = useState<PerformanceStat[]>([]);
    const [advMetrics, setAdvMetrics] = useState<AdvancedMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const base = process.env.NEXT_PUBLIC_API_URL;
        Promise.all([
            fetch(`${base}/api/v1/backtest/strategy/${strategy.id}/performance`).then(r => r.json()),
            fetch(`${base}/api/v1/backtest/equity-curve/${strategy.id}`).then(r => r.json()),
        ]).then(([perfJson, curveJson]) => {
            setPerfData(perfJson.performance_analysis || []);
            setAdvMetrics(curveJson.metrics || null);
        }).catch(console.error).finally(() => setLoading(false));
    }, [strategy.id]);

    const periodOrder = ['1 Day', '1 Week', '1 Month', '1 Quarter', '1 Year', '3 Years', '5 Years', '10 Years', 'Max'];

    const getPeriodData = (label: string) => perfData.find(p => p.period === label);

    const formatReturn = (stat: PerformanceStat | undefined) => {
        if (!stat) return { val: 'N/A', color: 'text-slate-500', annualized: false };
        const sign = stat.performance > 0 ? '+' : '';
        return {
            val: `${sign}${stat.performance.toFixed(2)}%`,
            color: stat.performance >= 0 ? 'text-emerald-400' : 'text-rose-400',
            annualized: stat.is_annualized,
            vol: `${stat.volatility.toFixed(1)}%`
        };
    };

    if (loading) return (
        <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-emerald-500">
                <div className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <span className="text-sm font-semibold">Loading analytics...</span>
            </div>
        </div>
    );

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={strategy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 md:space-y-6"
            >
                {/* Strategy Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">{strategy.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-widest font-semibold">Strategy Analytics</p>
                    </div>
                    <div className="flex gap-4 sm:gap-6">
                        <div className="text-right">
                            <p className="text-[0.6rem] text-slate-500 uppercase tracking-widest font-bold">Live YTD</p>
                            <p className={`text-2xl font-black ${strategy.ytd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {strategy.ytd >= 0 ? '+' : ''}{strategy.ytd.toFixed(2)}%
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[0.6rem] text-slate-500 uppercase tracking-widest font-bold">CAGR</p>
                            <p className="text-2xl font-black text-slate-100">{strategy.cagr.toFixed(2)}%</p>
                        </div>
                    </div>
                </div>

                {/* Returns Grid */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Trailing Returns
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
                        {['1 Year', '3 Years', '5 Years', '10 Years', 'Max'].map(period => {
                            const stat = getPeriodData(period);
                            const fmt = formatReturn(stat);
                            return (
                                <div key={period} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 md:p-4">
                                    <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest mb-1">{period}</p>
                                    <p className={`text-lg md:text-xl font-black ${fmt.color}`}>{fmt.val}</p>
                                    {fmt.annualized && <p className="text-[0.55rem] text-slate-600 uppercase tracking-wider mt-0.5">Ann.</p>}
                                    {stat && <p className="text-[0.6rem] text-slate-500 mt-1">Vol: {fmt.vol}</p>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Short-term */}
                    <div className="grid grid-cols-4 gap-2 md:gap-3 mt-2 md:mt-3">
                        {['1 Day', '1 Week', '1 Month', '1 Quarter'].map(period => {
                            const stat = getPeriodData(period);
                            const fmt = formatReturn(stat);
                            return (
                                <div key={period} className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-2.5 md:p-3">
                                    <p className="text-[0.55rem] uppercase text-slate-500 font-bold tracking-widest mb-1">{period}</p>
                                    <p className={`text-sm md:text-base font-black ${fmt.color}`}>{fmt.val}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Risk & Advanced Metrics */}
                {advMetrics && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                            Risk-Adjusted Performance
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
                            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 md:p-4">
                                <StatCell label="Sharpe" value={advMetrics.sharpe.toFixed(2)} sub="Rf = 4%" color={advMetrics.sharpe >= 1 ? 'text-emerald-400' : 'text-slate-100'} />
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 md:p-4">
                                <StatCell label="Sortino" value={advMetrics.sortino.toFixed(2)} sub="Rf = 4%, downside" color={advMetrics.sortino >= 1 ? 'text-emerald-400' : 'text-slate-100'} />
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 md:p-4">
                                <StatCell label="Calmar" value={advMetrics.calmar.toFixed(2)} sub="Return / MaxDD" color={advMetrics.calmar >= 0.5 ? 'text-emerald-400' : 'text-slate-100'} />
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 md:p-4">
                                <StatCell label="Info Ratio" value={advMetrics.information_ratio.toFixed(2)} sub="vs benchmark" color={advMetrics.information_ratio >= 0 ? 'text-violet-400' : 'text-rose-400'} />
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 md:p-4">
                                <StatCell label="Alpha" value={`${advMetrics.alpha_pct > 0 ? '+' : ''}${advMetrics.alpha_pct.toFixed(2)}%`} sub="Ann. active return" color={advMetrics.alpha_pct >= 0 ? 'text-violet-400' : 'text-rose-400'} />
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 md:p-4">
                                <StatCell label="Beta" value={advMetrics.beta.toFixed(2)} sub="vs benchmark" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Drawdown & Volatility */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Risk Profile
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 md:p-4">
                            <StatCell label="Max Drawdown" value={`${strategy.max_dd.toFixed(2)}%`} sub="Peak-to-trough" color="text-rose-400" />
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 md:p-4">
                            <StatCell label="Ann. Volatility" value={`${strategy.volatility.toFixed(2)}%`} sub="Annualized std" />
                        </div>
                        {advMetrics && (
                            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 md:p-4 sm:col-span-2">
                                <StatCell label="Max DD Duration" value={`${advMetrics.max_dd_duration}`} sub="Trading days underwater" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Full trailing table */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        Full Trailing Performance
                    </h4>
                    <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-slate-950/80 text-slate-400 text-[0.6rem] sm:text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Period</th>
                                    <th className="px-4 py-3 text-right">Return</th>
                                    <th className="px-4 py-3 text-right hidden sm:table-cell">Type</th>
                                    <th className="px-4 py-3 text-right">Ann. Vol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {periodOrder.map((period) => {
                                    const stat = getPeriodData(period);
                                    if (!stat) return null;
                                    return (
                                        <tr key={period} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-2.5 font-semibold text-slate-200">{period}</td>
                                            <td className={`px-4 py-2.5 text-right font-black ${stat.performance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {stat.performance > 0 ? '+' : ''}{stat.performance.toFixed(2)}%
                                            </td>
                                            <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                                                <span className={`text-[0.6rem] uppercase font-bold px-1.5 py-0.5 rounded ${stat.is_annualized ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                                    {stat.is_annualized ? 'Annualized' : 'Cumulative'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-slate-400 font-semibold">
                                                {stat.volatility.toFixed(1)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
