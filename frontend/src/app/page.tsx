"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveStatsBanner from '../components/LiveStatsBanner';
import StrategyCard from '../components/StrategyCard';
import PerformanceTable from '../components/PerformanceTable';
import ProjectionCalc from '../components/ProjectionCalc';
import ChartInteractive, { type Period } from '../components/ChartInteractive';
import StrategyAnalyticsPanel from '../components/StrategyAnalyticsPanel';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 36 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' as const } }
};

// ── Strategy taxonomy (matches backend IDs) ───────────────────────────────────
const STRATEGIES = [
    { id: 'sector_rotation', label: 'Multiscale Sector Rotation', shortLabel: 'Sector Rot.' },
    { id: 'large_cap_100',   label: 'Multiscale Large Cap 100',   shortLabel: 'LC 100'      },
    { id: 'mag7_momentum',   label: 'Multiscale Mag 7',           shortLabel: 'Mag 7'       },
    { id: 'stgt_ensemble',   label: 'STGT Ensemble',              shortLabel: 'STGT AI'     },
    { id: 'risk_parity',     label: 'Multi-Horizon Risk Parity',  shortLabel: 'Risk Par.'   },
    { id: 'quality_factor',  label: 'S&P 500 Quality',            shortLabel: 'Quality'     },
] as const;

type StrategyId = typeof STRATEGIES[number]['id'];

const DEFAULT_METRICS = { cagr: 0, volatility: 0, sharpe: 0, max_dd: 0, ytd: 0 };

export default function Home() {
    const [metrics, setMetrics] = useState<Record<string, any>>({});
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyId>('sector_rotation');
    const [activeTab, setActiveTab] = useState<'historical' | 'projection'>('historical');
    const [chartPeriod, setChartPeriod] = useState<Period>('10y');

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/backtest/metrics`)
            .then(r => r.json())
            .then(setMetrics)
            .catch(() => console.error('Failed to load metrics'));
    }, []);

    const getM = (id: string) => metrics[id] ?? DEFAULT_METRICS;
    const currentMetrics = getM(selectedStrategy);
    const baseMetrics = getM('risk_parity');

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans pb-20 overflow-x-hidden selection:bg-emerald-500/30">
            <LiveStatsBanner strategyId={selectedStrategy} />

            {/* Ambient glow */}
            <div
                className="fixed top-0 left-1/2 -ml-[40rem] w-[80rem] h-[50rem] opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(15,23,42,0) 60%)' }}
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full"
            >
                {/* ── Hero & Main Dashboard ─────────────────────────────────── */}
                <motion.section
                    variants={itemVariants}
                    className="pt-16 md:pt-24 pb-8 px-4 md:px-6 max-w-[1600px] mx-auto w-full"
                >
                    {/* Hero text */}
                    <div className="text-center mb-10 md:mb-14 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[150px] md:h-[300px] bg-emerald-500/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                            className="relative"
                        >
                            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-emerald-100 to-emerald-500 tracking-tighter mb-4 drop-shadow-2xl">
                                Quantitative Intelligence
                            </h1>
                        </motion.div>
                        <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light drop-shadow-sm px-2">
                            Deep-learning powered multiscale covariance extraction, engineered for asymmetric structural risk capture.
                        </p>
                    </div>

                    {/* ── Main grid: strategy list (1 col) + workspace (3 cols) ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">

                        {/* Strategy Selector column */}
                        <div className="xl:col-span-1 flex flex-col gap-3">
                            <h2 className="text-lg font-display font-bold text-slate-200 mb-1 px-1">Alpha Engines</h2>

                            {/* Mobile: horizontal carousel */}
                            <div className="flex xl:hidden gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4">
                                {STRATEGIES.map(({ id, label }) => {
                                    const m = getM(id);
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => setSelectedStrategy(id)}
                                            className={`snap-start shrink-0 w-44 rounded-xl border p-4 text-left transition-all duration-300 ${
                                                selectedStrategy === id
                                                    ? 'bg-slate-800/60 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                                    : 'bg-slate-900/50 border-slate-800/50'
                                            }`}
                                        >
                                            <p className="text-xs font-bold text-slate-300 mb-2 leading-tight">{label}</p>
                                            <p className={`text-xl font-black ${m.ytd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {m.ytd >= 0 ? '+' : ''}{m.ytd.toFixed(1)}%
                                            </p>
                                            <p className="text-[0.58rem] text-slate-500 uppercase tracking-widest mt-0.5">YTD</p>
                                            <div className="mt-2 flex justify-between text-[0.62rem] text-slate-400">
                                                <span>CAGR <span className="text-slate-200 font-bold">{m.cagr.toFixed(1)}%</span></span>
                                                <span>SR <span className="text-slate-200 font-bold">{m.sharpe.toFixed(2)}</span></span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Desktop: vertical stack */}
                            <div className="hidden xl:flex flex-col gap-2.5">
                                {STRATEGIES.map(({ id, label }) => {
                                    const m = getM(id);
                                    return (
                                        <StrategyCard
                                            key={id}
                                            id={id}
                                            name={label}
                                            cagr={m.cagr}
                                            sharpe={m.sharpe}
                                            ytd={m.ytd}
                                            selected={selectedStrategy === id}
                                            onClick={() => setSelectedStrategy(id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Workspace: 3 cols */}
                        <div className="xl:col-span-3 flex flex-col gap-4 md:gap-5">
                            {/* Tab navigation */}
                            <div className="flex space-x-1 bg-slate-900/40 p-1 rounded-xl backdrop-blur-md border border-slate-700/50 w-full sm:w-fit">
                                {([['historical', 'Historical Backtest'], ['projection', 'Monte Carlo']] as const).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key)}
                                        className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                                            activeTab === key
                                                ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab content */}
                            <div className="bg-slate-900/20 border border-slate-800/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-3 md:p-5 relative overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'historical' ? (
                                        <motion.div
                                            key="tab-historical"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.25 }}
                                            className="flex flex-col xl:flex-row gap-4 md:gap-5"
                                        >
                                            {/* Chart — explicit height is the KEY FIX for ResponsiveContainer */}
                                            <div className="h-[460px] md:h-[520px] xl:flex-1">
                                                <ChartInteractive
                                                    strategyId={selectedStrategy}
                                                    period={chartPeriod}
                                                    onPeriodChange={setChartPeriod}
                                                />
                                            </div>
                                            {/* Trailing performance sidebar */}
                                            <div className="w-full xl:w-72 shrink-0">
                                                <PerformanceTable strategyId={selectedStrategy} />
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="tab-projection"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.25 }}
                                            className="pt-2"
                                        >
                                            <ProjectionCalc
                                                stgtMetrics={{ cagr: currentMetrics.cagr, volatility: currentMetrics.volatility }}
                                                baseMetrics={{ cagr: baseMetrics.cagr, volatility: baseMetrics.volatility }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ── Deep Analytics Panel ─────────────────────────────────── */}
                <motion.section
                    variants={itemVariants}
                    className="px-4 md:px-6 max-w-[1600px] mx-auto w-full mt-4 md:mt-6"
                >
                    {/* Strategy tab selector for analytics */}
                    <div className="flex gap-1.5 md:gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
                        {STRATEGIES.map(({ id, shortLabel }) => (
                            <button
                                key={id}
                                onClick={() => setSelectedStrategy(id)}
                                className={`shrink-0 px-3 md:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                    selectedStrategy === id
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                                }`}
                            >
                                {shortLabel}
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-900/30 border border-slate-800/60 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-8">
                        <StrategyAnalyticsPanel
                            strategyId={selectedStrategy}
                            strategyName={STRATEGIES.find(s => s.id === selectedStrategy)?.label ?? selectedStrategy}
                            cagr={currentMetrics.cagr}
                            volatility={currentMetrics.volatility}
                            sharpe={currentMetrics.sharpe}
                            ytd={currentMetrics.ytd}
                        />
                    </div>
                </motion.section>

                {/* ── Institutional Access Gate ────────────────────────────── */}
                <motion.section
                    variants={itemVariants}
                    className="max-w-3xl mx-auto w-full px-4 md:px-6 mt-8 md:mt-10 text-center"
                >
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-14 rounded-[1.5rem] md:rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-3xl -mr-[20rem] -mt-[20rem] transition-transform duration-1000 group-hover:scale-110" />
                        <div className="relative z-10">
                            <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">Unlock the Terminal</h3>
                            <p className="text-slate-400 mb-6 max-w-lg mx-auto text-base md:text-lg">
                                Gain institutional API access to Fama-French 6-Factor attribution, Probabilistic Sharpe (PSR), and dynamic weight ledgers.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <input
                                    type="email"
                                    placeholder="Institutional Email Required"
                                    className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 w-full sm:w-80 placeholder-slate-600 transition-colors backdrop-blur-sm"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition-colors whitespace-nowrap shadow-xl shadow-emerald-900/40"
                                >
                                    Request Access
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.section>
            </motion.div>
        </div>
    );
}
