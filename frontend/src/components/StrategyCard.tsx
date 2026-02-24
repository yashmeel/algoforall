"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface StrategyProps {
    id: string;
    name: string;
    description?: string;
    tags?: string[];
    cagr: number;
    sharpe: number;
    ytd: number;
    selected: boolean;
    onClick: () => void;
}

export default function StrategyCard({
    id, name, description, tags, cagr, sharpe, ytd, selected, onClick
}: StrategyProps) {
    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`cursor-pointer transition-all duration-500 rounded-2xl border p-5 relative overflow-hidden backdrop-blur-xl ${selected
                ? 'bg-slate-800/40 border-emerald-500/50 shadow-[0_8px_32px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20'
                : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700/80 hover:bg-slate-800/50 hover:shadow-lg'
            }`}
        >
            {/* Glow when selected */}
            {selected && (
                <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-0 bg-emerald-500/10 blur-3xl z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                />
            )}

            <div className="relative z-10">
                {/* Name + indicator */}
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-bold tracking-tight text-white leading-tight pr-2">{name}</h3>
                    <div className="flex h-3 w-3 items-center justify-center shrink-0 mt-0.5">
                        {selected ? (
                            <>
                                <motion.span
                                    className="absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]" />
                            </>
                        ) : (
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600" />
                        )}
                    </div>
                </div>

                {/* 3 stats: YTD (prominent) | CAGR | Sharpe */}
                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <p className="text-[0.6rem] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">YTD</p>
                        <p className={`text-2xl font-black drop-shadow-md ${ytd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {ytd >= 0 ? '+' : ''}{ytd.toFixed(1)}%
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[0.6rem] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">CAGR</p>
                        <p className="text-base font-black text-slate-100">{cagr.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[0.6rem] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Sharpe</p>
                        <p className={`text-base font-black ${sharpe >= 1 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {sharpe.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
