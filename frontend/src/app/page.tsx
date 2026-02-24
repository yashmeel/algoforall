"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveStatsBanner from '../components/LiveStatsBanner';
import StrategyCard from '../components/StrategyCard';
import PerformanceTable from '../components/PerformanceTable';
import ProjectionCalc from '../components/ProjectionCalc';
import ChartInteractive from '../components/ChartInteractive';
import StrategyDetailPanel from '../components/StrategyDetailPanel';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } }
};

export default function Home() {
    const [metrics, setMetrics] = useState<any>(null);
    const [selectedStrategy, setSelectedStrategy] = useState("dynamic_alpha");
    const [activeTab, setActiveTab] = useState<'historical' | 'projection'>('historical');

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/backtest/metrics`);
                const data = await res.json();
                setMetrics(data);
            } catch (e) {
                console.error("Failed to load metrics");
            }
        };
        fetchMetrics();
    }, []);

    const stgtMetrics = metrics?.dynamic_alpha || { cagr: 13.60, volatility: 17.58, sharpe: 0.73, max_dd: -40.59, ytd: 6.10 };
    const baseMetrics = metrics?.horizon_parity || { cagr: 13.02, volatility: 16.10, sharpe: 0.76, max_dd: -37.22, ytd: 6.45 };
    const msMetrics = metrics?.mag7_multiscale || { cagr: 26.18, volatility: 22.92, sharpe: 1.13, max_dd: -32.82, ytd: 0 };
    const rpMetrics = metrics?.mag7_riskparity || { cagr: 18.97, volatility: 20.40, sharpe: 0.95, max_dd: -32.94, ytd: 0 };
    const qualMetrics = metrics?.quality_factor || { cagr: 14.2, volatility: 15.2, sharpe: 0.91, max_dd: -21.4, ytd: 0 };

    const currentMetrics =
        selectedStrategy === "dynamic_alpha" ? stgtMetrics :
            selectedStrategy === "horizon_parity" ? baseMetrics :
                selectedStrategy === "mag7_multiscale" ? msMetrics :
                    selectedStrategy === "quality_100" ? qualMetrics : rpMetrics;

    const getBaseMetrics = () => {
        if (selectedStrategy.includes("mag7")) return rpMetrics;
        if (selectedStrategy === "quality_factor") return qualMetrics;
        return baseMetrics;
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans pb-16 overflow-x-hidden selection:bg-emerald-500/30">
            <LiveStatsBanner />

            {/* Dynamic Background Glow */}
            <div className="fixed top-0 left-1/2 -ml-[40rem] w-[80rem] h-[50rem] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(15,23,42,0) 60%)' }} />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full"
            >
                {/* Hero & Dashboard */}
                <motion.section variants={itemVariants} className="pt-16 md:pt-24 pb-10 px-4 md:px-6 max-w-[1600px] mx-auto w-full">
                    <div className="text-center mb-10 md:mb-16 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[150px] md:h-[300px] bg-emerald-500/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="relative"
                        >
                            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-emerald-100 to-emerald-500 tracking-tighter mb-4 md:mb-6 drop-shadow-2xl">
                                Quantitative Intelligence
                            </h1>
                        </motion.div>
                        <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light drop-shadow-sm px-2">
                            Deep-learning powered multiscale covariance extraction, engineered for asymmetric structural risk capture.
                        </p>
                    </div>

                    {/* Unified Dashboard Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
                        {/* STRATEGY SELECTOR: horizontal scroll on mobile, sidebar on desktop */}
                        <div className="xl:col-span-1 flex flex-col gap-3">
                            <h2 className="text-lg md:text-xl font-display font-bold text-slate-200 mb-1 px-1">Alpha Engines</h2>
                            {/* Mobile: horizontal scroll carousel */}
                            <div className="flex xl:hidden gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4">
                                {[
                                    { id: "dynamic_alpha", name: "Dynamic Sector Alpha", metrics: stgtMetrics },
                                    { id: "horizon_parity", name: "Sector Baseline", metrics: baseMetrics },
                                    { id: "mag7_multiscale", name: "Mag 7 Multiscale", metrics: msMetrics },
                                    { id: "mag7_riskparity", name: "Mag 7 Risk Parity", metrics: rpMetrics },
                                    { id: "quality_factor", name: "S&P 500 Quality", metrics: qualMetrics },
                                ].map(({ id, name, metrics: m }) => (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedStrategy(id)}
                                        className={`snap-start shrink-0 w-48 rounded-xl border p-4 text-left transition-all duration-300 ${selectedStrategy === id
                                            ? 'bg-slate-800/60 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                            : 'bg-slate-900/50 border-slate-800/50'
                                        }`}
                                    >
                                        <p className="text-xs font-bold text-slate-300 mb-2 leading-tight">{name}</p>
                                        <p className="text-xl font-black text-emerald-400">+{m.ytd.toFixed(2)}%</p>
                                        <p className="text-[0.6rem] text-slate-500 uppercase tracking-widest mt-0.5">YTD</p>
                                        <div className="mt-2 flex justify-between text-[0.65rem] text-slate-400">
                                            <span>CAGR <span className="text-slate-200 font-bold">{m.cagr.toFixed(1)}%</span></span>
                                            <span>SR <span className="text-slate-200 font-bold">{m.sharpe.toFixed(2)}</span></span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {/* Desktop: vertical list */}
                            <div className="hidden xl:flex flex-col gap-4">
                                <StrategyCard
                                    id="dynamic_alpha"
                                    name="Dynamic Sector Alpha"
                                    cagr={stgtMetrics.cagr}
                                    sharpe={stgtMetrics.sharpe}
                                    max_dd={stgtMetrics.max_dd}
                                    ytd={stgtMetrics.ytd}
                                    selected={selectedStrategy === "dynamic_alpha"}
                                    onClick={() => setSelectedStrategy("dynamic_alpha")}
                                />
                                <StrategyCard
                                    id="horizon_parity"
                                    name="Sector Baseline"
                                    cagr={baseMetrics.cagr}
                                    sharpe={baseMetrics.sharpe}
                                    max_dd={baseMetrics.max_dd}
                                    ytd={baseMetrics.ytd}
                                    selected={selectedStrategy === "horizon_parity"}
                                    onClick={() => setSelectedStrategy("horizon_parity")}
                                />
                                <StrategyCard
                                    id="mag7_multiscale"
                                    name="Mag 7 Multiscale"
                                    cagr={msMetrics.cagr}
                                    sharpe={msMetrics.sharpe}
                                    max_dd={msMetrics.max_dd}
                                    ytd={msMetrics.ytd}
                                    selected={selectedStrategy === "mag7_multiscale"}
                                    onClick={() => setSelectedStrategy("mag7_multiscale")}
                                />
                                <StrategyCard
                                    id="mag7_riskparity"
                                    name="Mag 7 Risk Parity"
                                    cagr={rpMetrics.cagr}
                                    sharpe={rpMetrics.sharpe}
                                    max_dd={rpMetrics.max_dd}
                                    ytd={rpMetrics.ytd}
                                    selected={selectedStrategy === "mag7_riskparity"}
                                    onClick={() => setSelectedStrategy("mag7_riskparity")}
                                />
                                <StrategyCard
                                    id="quality_factor"
                                    name="S&P 500 Quality Factor"
                                    description="Automated fundamental filter. Selects top 100 S&P 500 stocks via 5-year rolling ROA and Cash Flow Margin. Reconstituted semi-annually."
                                    tags={["Fundamental", "S&P 500", "Market Cap Weighted"]}
                                    cagr={qualMetrics.cagr}
                                    sharpe={qualMetrics.sharpe}
                                    max_dd={qualMetrics.max_dd}
                                    ytd={qualMetrics.ytd}
                                    selected={selectedStrategy === "quality_factor"}
                                    onClick={() => setSelectedStrategy("quality_factor")}
                                />
                            </div>
                        </div>

                        {/* RIGHT MAIN PANE: Workspace */}
                        <div className="xl:col-span-3 flex flex-col">
                            {/* Tab Navigation */}
                            <div className="flex space-x-1 mb-4 md:mb-6 bg-slate-900/40 p-1 rounded-xl backdrop-blur-md border border-slate-700/50 w-full sm:w-fit">
                                <button
                                    onClick={() => setActiveTab('historical')}
                                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${activeTab === 'historical'
                                        ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    Historical Backtest
                                </button>
                                <button
                                    onClick={() => setActiveTab('projection')}
                                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${activeTab === 'projection'
                                        ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    Monte Carlo
                                </button>
                            </div>

                            {/* Tab Content Area */}
                            <div className="flex-1 bg-slate-900/20 border border-slate-800/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-3 md:p-6 relative overflow-hidden">
                                <AnimatePresence mode='wait'>
                                    {activeTab === 'historical' ? (
                                        <motion.div
                                            key="tab-historical"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex flex-col xl:flex-row gap-4 md:gap-6"
                                        >
                                            <div className="flex-1 min-h-[400px] md:min-h-[500px]">
                                                <ChartInteractive strategyId={selectedStrategy} />
                                            </div>
                                            <div className="w-full xl:w-80 shrink-0">
                                                <PerformanceTable strategyId={selectedStrategy} />
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="tab-projection"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="pt-2 md:pt-4"
                                        >
                                            <ProjectionCalc
                                                stgtMetrics={{ cagr: currentMetrics.cagr, volatility: currentMetrics.volatility }}
                                                baseMetrics={{ cagr: getBaseMetrics().cagr, volatility: getBaseMetrics().volatility }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Full Strategy Analytics Section */}
                <motion.section variants={itemVariants} className="px-4 md:px-6 max-w-[1600px] mx-auto w-full mt-6 md:mt-8">
                    <div className="bg-slate-900/30 border border-slate-800/60 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-8">
                        {/* Strategy Tabs */}
                        <div className="flex gap-1.5 md:gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
                            {[
                                { id: "dynamic_alpha", label: "Dynamic Alpha" },
                                { id: "horizon_parity", label: "Sector Baseline" },
                                { id: "mag7_multiscale", label: "Mag7 Multi" },
                                { id: "mag7_riskparity", label: "Mag7 RP" },
                                { id: "quality_factor", label: "Quality 100" },
                            ].map(({ id, label }) => (
                                <button
                                    key={id}
                                    onClick={() => setSelectedStrategy(id)}
                                    className={`shrink-0 px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${
                                        selectedStrategy === id
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <StrategyDetailPanel
                            strategy={{
                                id: selectedStrategy,
                                name: selectedStrategy === "dynamic_alpha" ? "Dynamic Sector Alpha"
                                    : selectedStrategy === "horizon_parity" ? "Sector Baseline"
                                    : selectedStrategy === "mag7_multiscale" ? "Mag 7 Multiscale"
                                    : selectedStrategy === "quality_factor" ? "S&P 500 Quality Factor"
                                    : "Mag 7 Risk Parity",
                                cagr: currentMetrics.cagr,
                                volatility: currentMetrics.volatility,
                                sharpe: currentMetrics.sharpe,
                                max_dd: currentMetrics.max_dd,
                                ytd: currentMetrics.ytd,
                            }}
                        />
                    </div>
                </motion.section>

                {/* Gating & Advanced Quant */}
                <motion.section variants={itemVariants} className="max-w-3xl mx-auto w-full px-4 md:px-6 mt-6 md:mt-8 text-center">
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-14 rounded-[1.5rem] md:rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-3xl -mr-[20rem] -mt-[20rem] transition-transform duration-1000 group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <h3 className="text-2xl md:text-3xl font-black text-white mb-3 md:mb-4 tracking-tight">Unlock the Terminal</h3>
                            <p className="text-slate-400 mb-6 md:mb-8 max-w-lg mx-auto text-base md:text-lg">
                                Gain institutional API access to the Fama-French 6-Factor attribution, Probabilistic Sharpe (PSR), and dynamic weight ledgers.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                                <input
                                    type="email"
                                    placeholder="Institutional Email Required"
                                    className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 md:px-5 md:py-4 text-white focus:outline-none focus:border-emerald-500 w-full sm:w-80 md:w-96 text-base placeholder-slate-600 transition-colors backdrop-blur-sm"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 md:py-4 px-8 rounded-xl transition-colors whitespace-nowrap shadow-xl shadow-emerald-900/40 text-base md:text-lg"
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
