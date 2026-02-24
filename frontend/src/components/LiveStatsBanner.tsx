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
            className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 py-2.5 px-4 md:px-6 flex flex-row justify-between items-center w-full shadow-lg z-50 sticky top-0 gap-2"
        >
            <div className="flex items-center space-x-2 shrink-0">
                <span className="relative flex h-2.5 w-2.5 md:h-3 md:w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </span>
                <span className="text-slate-300 text-xs font-bold tracking-widest uppercase hidden sm:block">
                    Live Model
                </span>
                <span className="text-[0.65rem] text-slate-500 hidden md:block">| {stats.last_updated}</span>
            </div>

            <div className="flex gap-4 sm:gap-6 md:gap-8">
                <div className="flex flex-col items-end">
                    <span className="text-[0.55rem] md:text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold">YTD</span>
                    <AnimatePresence mode='wait'>
                        <motion.span
                            key={stats.ytd_return}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            className={`text-xs md:text-sm font-black drop-shadow-md ${stats.ytd_return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                        >
                            {stats.ytd_return > 0 ? '+' : ''}{stats.ytd_return.toFixed(2)}%
                        </motion.span>
                    </AnimatePresence>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[0.55rem] md:text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold">Drawdown</span>
                    <AnimatePresence mode='wait'>
                        <motion.span
                            key={stats.current_drawdown}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            className="text-xs md:text-sm font-black text-rose-400 drop-shadow-md"
                        >
                            {stats.current_drawdown.toFixed(2)}%
                        </motion.span>
                    </AnimatePresence>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[0.55rem] md:text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold">30D Vol</span>
                    <AnimatePresence mode='wait'>
                        <motion.span
                            key={stats.rolling_30d_vol}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            className="text-xs md:text-sm font-bold text-slate-300"
                        >
                            {stats.rolling_30d_vol.toFixed(2)}%
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
