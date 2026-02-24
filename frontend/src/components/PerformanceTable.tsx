"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PerformanceStat {
    period: string;
    performance: number;
    volatility: number;
    is_annualized: boolean;
}

export default function PerformanceTable({ strategyId = 'dynamic_alpha' }) {
    const [performanceData, setPerformanceData] = useState<PerformanceStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/backtest/strategy/${strategyId}/performance`);
                const data = await response.json();
                setPerformanceData(data.performance_analysis || []);
            } catch (error) {
                console.error("Failed to fetch performance stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPerformance();
    }, [strategyId]);

    if (loading) return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-[400px] flex items-center justify-center shadow-xl">
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-emerald-500 font-semibold tracking-wide flex items-center gap-3 text-lg">
                <div className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                Calculating Trailing Horizons...
            </motion.div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col"
        >
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-xl font-bold text-white tracking-tight">Trailing Performance</h3>
                <p className="text-sm text-slate-400 mt-1">
                    Standardized multi-horizon returns and volatility estimates.
                </p>
            </div>

            <div className="overflow-x-auto flex-1 h-full">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Timeframe</th>
                            <th className="px-6 py-4 text-right">Return</th>
                            <th className="px-6 py-4 text-right">Ann. Vol</th>
                        </tr>
                    </thead>
                    <motion.tbody
                        className="divide-y divide-slate-800/80"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.05 } }
                        }}
                    >
                        {performanceData.map((stat, idx) => (
                            <motion.tr
                                key={idx}
                                variants={{
                                    hidden: { opacity: 0, x: -10 },
                                    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
                                }}
                                whileHover={{ backgroundColor: "rgba(30,41,59,0.8)", x: 8 }}
                                className="transition-colors cursor-default"
                            >
                                <td className="px-6 py-3 font-bold text-slate-100">{stat.period}</td>
                                <td className={`px-6 py-3 text-right font-black text-base drop-shadow-sm ${stat.performance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {stat.performance > 0 ? '+' : ''}{stat.performance.toFixed(2)}%
                                    {stat.is_annualized && <span className="text-[0.6rem] ml-1 text-slate-500 uppercase tracking-tighter">Ann</span>}
                                </td>
                                <td className="px-6 py-3 text-right font-semibold text-slate-300">
                                    {stat.volatility.toFixed(2)}%
                                </td>
                            </motion.tr>
                        ))}
                    </motion.tbody>
                </table>
            </div>
        </motion.div>
    );
}
