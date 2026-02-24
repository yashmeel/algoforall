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
    max_dd: number;
    ytd: number;
    selected: boolean;
    onClick: () => void;
}

export default function StrategyCard({ id, name, description, tags, cagr, sharpe, max_dd, ytd, selected, onClick }: StrategyProps) {
    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`cursor-pointer transition-all duration-500 rounded-2xl border p-6 relative overflow-hidden backdrop-blur-xl ${selected
                ? 'bg-slate-800/40 border-emerald-500/50 shadow-[0_8px_32px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20'
                : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700/80 hover:bg-slate-800/50 hover:shadow-lg'
                }`}
        >
            {/* Background Glow */}
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
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold tracking-tight text-white drop-shadow-md">{name}</h3>
                    <div className="flex h-3 w-3 items-center justify-center">
                        {selected ? (
                            <>
                                <motion.span
                                    className="absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]"></span>
                            </>
                        ) : (
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Live YTD</p>
                        <p className="text-2xl font-black text-emerald-400 drop-shadow-md">+{ytd.toFixed(2)}%</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">True CAGR</p>
                        <p className="text-2xl font-black text-slate-100">{cagr.toFixed(2)}%</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Sharpe</p>
                        <p className="text-lg font-medium text-slate-300">{sharpe.toFixed(2)}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Max DD</p>
                        <p className="text-lg font-medium text-rose-400">{max_dd.toFixed(2)}%</p>
                    </motion.div>
                </div>

                {description && (
                    <div className="mt-5 pt-5 border-t border-slate-700/50">
                        <p className="text-sm text-slate-400 mb-3 leading-relaxed">{description}</p>

                        {tags && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700/50">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
