"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '../lib/api';

interface PerformanceStat {
    period: string;
    performance: number;
    volatility: number;
    is_annualized: boolean;
}

// Key periods shown prominently; short-term hidden by default
const KEY_PERIODS = ['1 Year', '5 Years', '10 Years', 'Max'];
const SHORT_PERIODS = ['1 Day', '1 Week', '1 Month', '1 Quarter'];

export default function PerformanceTable({ strategyId = 'sector_rotation' }) {
    const [performanceData, setPerformanceData] = useState<PerformanceStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [showShort, setShowShort] = useState(false);

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `${API_URL}/api/v1/backtest/strategy/${strategyId}/performance`
                );
                const data = await response.json();
                setPerformanceData(data.performance_analysis || []);
            } catch (error) {
                console.error('Failed to fetch performance stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPerformance();
    }, [strategyId]);

    const getPeriod = (label: string) => performanceData.find(p => p.period === label);

    const renderRow = (period: string, highlight = false) => {
        const stat = getPeriod(period);
        if (!stat) return null;
        const pos = stat.performance >= 0;
        return (
            <motion.tr
                key={period}
                variants={{
                    hidden: { opacity: 0, x: -8 },
                    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 120 } }
                }}
                className={`transition-colors hover:bg-slate-800/30 ${highlight ? 'border-l-2 border-emerald-500/50' : ''}`}
            >
                <td className={`px-4 py-2.5 font-bold whitespace-nowrap ${highlight ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {period}
                </td>
                <td className={`px-4 py-2.5 text-right font-black whitespace-nowrap ${pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pos ? '+' : ''}{stat.performance.toFixed(2)}%
                    {stat.is_annualized && (
                        <span className="text-[0.52rem] ml-1 text-slate-500 uppercase tracking-tighter hidden sm:inline">Ann</span>
                    )}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-400 whitespace-nowrap">
                    {stat.volatility.toFixed(1)}%
                </td>
            </motion.tr>
        );
    };

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[280px] flex items-center justify-center shadow-xl">
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-emerald-500 font-semibold flex items-center gap-3"
                >
                    <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    Calculating...
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
            <div className="px-4 md:px-5 py-4 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-base font-bold text-white tracking-tight">Trailing Performance</h3>
                <p className="text-xs text-slate-500 mt-0.5">Key period returns &amp; volatility</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 text-[0.58rem] sm:text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-4 py-2.5">Period</th>
                            <th className="px-4 py-2.5 text-right">Return</th>
                            <th className="px-4 py-2.5 text-right">Vol</th>
                        </tr>
                    </thead>
                    <motion.tbody
                        className="divide-y divide-slate-800/70"
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                    >
                        {KEY_PERIODS.map(p => renderRow(p, p === '5 Years' || p === '10 Years'))}
                    </motion.tbody>
                </table>
            </div>

            {/* Short-term toggle */}
            <button
                onClick={() => setShowShort(v => !v)}
                className="w-full px-4 py-2.5 text-xs text-slate-500 hover:text-slate-300 border-t border-slate-800/60 flex items-center justify-center gap-1.5 transition-colors hover:bg-slate-800/20"
            >
                <span>{showShort ? '▲ Hide' : '▼ Show'} short-term (1D–1Q)</span>
            </button>

            {showShort && (
                <div className="overflow-x-auto border-t border-slate-800/40">
                    <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                        <motion.tbody
                            className="divide-y divide-slate-800/50"
                            initial="hidden"
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                        >
                            {SHORT_PERIODS.map(p => renderRow(p, false))}
                        </motion.tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );
}
