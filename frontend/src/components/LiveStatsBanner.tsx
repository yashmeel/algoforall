"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveStats {
    last_updated: string;
    ytd_return: number;
    current_drawdown: number;
    rolling_30d_vol: number;
    status: string;
}

export default function LiveStatsBanner({ strategyId = 'dynamic_alpha' }: { strategyId?: string }) {
    const [stats, setStats] = useState<LiveStats | null>(null);

    useEffect(() => {
        const fetchLiveStats = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/live/stats/${strategyId}`);
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch live stats", error);
            }
        };
        fetchLiveStats();
    }, [strategyId]);

    if (!stats) return null;

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 py-3 px-6 flex flex-col md:flex-row justify-between items-center w-full shadow-lg z-50 sticky top-0"
        >
            <div className="flex items-center space-x-3 mb-2 md:mb-0">
                <div className="flex items-center justify-center">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    </span>
                </div>
                <span className="text-slate-300 text-sm font-bold tracking-widest uppercase">
                    Live Model <span className="text-slate-600 mx-2">|</span> Last Close: <span className="text-slate-100">{stats.last_updated}</span>
                </span>
            </div>

            <div className="flex space-x-8">
                <div className="flex flex-col items-end">
                    <span className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold">Live YTD</span>
                    <AnimatePresence mode='wait'>
                        <motion.span
                            key={stats.ytd_return}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            className={`text-sm font-black drop-shadow-md ${stats.ytd_return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                        >
                            {stats.ytd_return > 0 ? '+' : ''}{stats.ytd_return.toFixed(2)}%
                        </motion.span>
                    </AnimatePresence>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold">Drawdown</span>
                    <AnimatePresence mode='wait'>
                        <motion.span
                            key={stats.current_drawdown}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            className="text-sm font-black text-rose-400 drop-shadow-md"
                        >
                            {stats.current_drawdown.toFixed(2)}%
                        </motion.span>
                    </AnimatePresence>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold">30D Realized Vol</span>
                    <AnimatePresence mode='wait'>
                        <motion.span
                            key={stats.rolling_30d_vol}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            className="text-sm font-bold text-slate-300"
                        >
                            {stats.rolling_30d_vol.toFixed(2)}%
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
