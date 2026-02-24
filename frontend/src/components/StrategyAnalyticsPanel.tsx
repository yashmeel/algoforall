"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

interface PerfStat {
    period: string;
    performance: number;
    volatility: number;
    is_annualized: boolean;
}

interface CurveMetrics {
    sharpe: number;
    sortino: number;
    calmar: number;
    information_ratio: number;
    alpha_pct: number;
    beta: number;
    max_dd_duration: number;
}

interface Attribution {
    alpha_ann_pct: number;
    beta_market: number;
    beta_size: number;
    beta_value: number;
    r_squared: number;
    tracking_error_pct: number;
    information_ratio: number;
    win_rate_pct: number;
    n_observations: number;
    error?: string;
}

interface Props {
    strategyId: string;
    strategyName: string;
    cagr: number;
    volatility: number;
    sharpe: number;
    ytd: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Tile({
    label, value, sub, color = 'text-slate-100', large = false
}: {
    label: string; value: string; sub?: string; color?: string; large?: boolean;
}) {
    return (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 md:p-4 flex flex-col gap-0.5">
            <p className="text-[0.58rem] uppercase text-slate-500 font-bold tracking-widest leading-none">{label}</p>
            <p className={`font-black leading-tight ${large ? 'text-xl md:text-2xl' : 'text-base md:text-lg'} ${color}`}>
                {value}
            </p>
            {sub && <p className="text-[0.58rem] text-slate-600 leading-none mt-0.5">{sub}</p>}
        </div>
    );
}

function SectionHeader({ color, label }: { color: string; label: string }) {
    return (
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
            {label}
        </h4>
    );
}

function sign(n: number) { return n >= 0 ? '+' : ''; }

// ── Main Component ────────────────────────────────────────────────────────────

export default function StrategyAnalyticsPanel({
    strategyId, strategyName, cagr, volatility, sharpe, ytd
}: Props) {
    const [perfData, setPerfData] = useState<PerfStat[]>([]);
    const [curveMetrics, setCurveMetrics] = useState<CurveMetrics | null>(null);
    const [attribution, setAttribution] = useState<Attribution | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const base = process.env.NEXT_PUBLIC_API_URL;
        Promise.all([
            fetch(`${base}/api/v1/backtest/strategy/${strategyId}/performance`).then(r => r.json()),
            fetch(`${base}/api/v1/backtest/equity-curve/${strategyId}`).then(r => r.json()),
            fetch(`${base}/api/v1/backtest/strategy/${strategyId}/attribution`).then(r => r.json()),
        ])
            .then(([perfJson, curveJson, attribJson]) => {
                setPerfData(perfJson.performance_analysis || []);
                setCurveMetrics(curveJson.metrics || null);
                setAttribution(attribJson.error ? null : attribJson);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [strategyId]);

    const getPeriod = (label: string) => perfData.find(p => p.period === label);

    const fmtReturn = (stat?: PerfStat) => {
        if (!stat) return { val: '—', color: 'text-slate-500' };
        const s = stat.performance;
        return {
            val: `${sign(s)}${s.toFixed(2)}%`,
            color: s >= 0 ? 'text-emerald-400' : 'text-rose-400',
            annualized: stat.is_annualized,
            vol: `${stat.volatility.toFixed(1)}%`,
        };
    };

    // Period rows to show in the main table
    const TABLE_PERIODS = ['YTD', '1 Year', '3 Years', '5 Years', '10 Years', 'Max'] as const;

    // YTD comes from the metrics API (not from the performance endpoint)
    const ytdRow = { performance: ytd, volatility: volatility, is_annualized: false, period: 'YTD' };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3 text-emerald-500">
                    <div className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <span className="text-sm font-semibold">Loading analytics...</span>
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={strategyId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="space-y-6 md:space-y-8"
            >
                {/* Strategy header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800/60">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">{strategyName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-widest font-semibold">
                            Full Strategy Analytics
                        </p>
                    </div>
                    <div className="flex gap-5 sm:gap-8">
                        <div className="text-right">
                            <p className="text-[0.6rem] text-slate-500 uppercase tracking-widest font-bold">YTD</p>
                            <p className={`text-2xl font-black ${ytd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {sign(ytd)}{ytd.toFixed(2)}%
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[0.6rem] text-slate-500 uppercase tracking-widest font-bold">CAGR</p>
                            <p className="text-2xl font-black text-slate-100">{cagr.toFixed(2)}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[0.6rem] text-slate-500 uppercase tracking-widest font-bold">Sharpe</p>
                            <p className={`text-2xl font-black ${sharpe >= 1 ? 'text-emerald-400' : 'text-slate-100'}`}>
                                {sharpe.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Section A: Period Returns Table ── */}
                <div>
                    <SectionHeader color="bg-emerald-500" label="Period Returns" />
                    <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-slate-950/80 text-slate-400 text-[0.6rem] sm:text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 w-28">Period</th>
                                    <th className="px-4 py-3 text-right">Return</th>
                                    <th className="px-4 py-3 text-right hidden sm:table-cell">Type</th>
                                    <th className="px-4 py-3 text-right">Ann. Vol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {TABLE_PERIODS.map(period => {
                                    const raw = period === 'YTD' ? ytdRow : getPeriod(period);
                                    const fmt = fmtReturn(raw);
                                    const highlight = period === '5 Years' || period === '10 Years';
                                    return (
                                        <tr
                                            key={period}
                                            className={`transition-colors hover:bg-slate-800/30 ${highlight ? 'border-l-2 border-emerald-500/60' : ''}`}
                                        >
                                            <td className={`px-4 py-3 font-bold ${highlight ? 'text-emerald-300' : 'text-slate-200'} whitespace-nowrap`}>
                                                {period}
                                                {highlight && (
                                                    <span className="ml-1.5 text-[0.5rem] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded uppercase font-black tracking-wider hidden sm:inline">
                                                        KEY
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-black text-base ${fmt.color} whitespace-nowrap`}>
                                                {fmt.val}
                                            </td>
                                            <td className="px-4 py-3 text-right hidden sm:table-cell">
                                                {raw && (
                                                    <span className={`text-[0.58rem] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                        raw.is_annualized
                                                            ? 'bg-emerald-900/30 text-emerald-500'
                                                            : 'bg-slate-800 text-slate-500'
                                                    }`}>
                                                        {raw.is_annualized ? 'Annualized' : 'Cumulative'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-400 font-semibold whitespace-nowrap">
                                                {raw ? `${raw.volatility.toFixed(1)}%` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Short-term row */}
                    <div className="grid grid-cols-4 gap-2 mt-2.5">
                        {['1 Day', '1 Week', '1 Month', '1 Quarter'].map(p => {
                            const fmt = fmtReturn(getPeriod(p));
                            return (
                                <div key={p} className="bg-slate-900/40 border border-slate-800/40 rounded-xl px-3 py-2.5">
                                    <p className="text-[0.55rem] uppercase text-slate-500 font-bold tracking-widest mb-1">{p}</p>
                                    <p className={`text-sm font-black ${fmt.color}`}>{fmt.val}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Section B: Risk-Adjusted Performance ── */}
                {curveMetrics && (
                    <div>
                        <SectionHeader color="bg-violet-500" label="Risk-Adjusted Performance" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
                            <Tile
                                label="Sharpe Ratio"
                                value={curveMetrics.sharpe.toFixed(2)}
                                sub="Rf = 4%"
                                color={curveMetrics.sharpe >= 1 ? 'text-emerald-400' : 'text-slate-100'}
                            />
                            <Tile
                                label="Sortino Ratio"
                                value={curveMetrics.sortino.toFixed(2)}
                                sub="Downside dev."
                                color={curveMetrics.sortino >= 1 ? 'text-emerald-400' : 'text-slate-100'}
                            />
                            <Tile
                                label="Calmar Ratio"
                                value={curveMetrics.calmar.toFixed(2)}
                                sub="CAGR / MaxDD"
                                color={curveMetrics.calmar >= 0.5 ? 'text-emerald-400' : 'text-slate-100'}
                            />
                            <Tile
                                label="Info Ratio"
                                value={curveMetrics.information_ratio.toFixed(2)}
                                sub="vs benchmark"
                                color={curveMetrics.information_ratio >= 0 ? 'text-violet-400' : 'text-rose-400'}
                            />
                            <Tile
                                label="Alpha"
                                value={`${sign(curveMetrics.alpha_pct)}${curveMetrics.alpha_pct.toFixed(2)}%`}
                                sub="Ann. active ret."
                                color={curveMetrics.alpha_pct >= 0 ? 'text-violet-400' : 'text-rose-400'}
                            />
                            <Tile
                                label="Beta"
                                value={curveMetrics.beta.toFixed(2)}
                                sub="vs benchmark"
                            />
                        </div>
                    </div>
                )}

                {/* ── Section C: Risk Profile ── */}
                <div>
                    <SectionHeader color="bg-rose-500" label="Risk Profile" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                        <Tile
                            label="Max Drawdown"
                            value={curveMetrics ? `${(1 / Math.max(curveMetrics.calmar, 0.001) * cagr).toFixed(1)}%` : '—'}
                            sub="Est. from Calmar × CAGR"
                            color="text-rose-400"
                        />
                        <Tile label="Ann. Volatility" value={`${volatility.toFixed(2)}%`} sub="Annualized std" />
                        {curveMetrics && (
                            <>
                                <Tile
                                    label="Max DD Duration"
                                    value={`${curveMetrics.max_dd_duration} days`}
                                    sub="Trading days underwater"
                                    color="text-rose-300"
                                />
                                <Tile
                                    label="Beta to Market"
                                    value={curveMetrics.beta.toFixed(2)}
                                    sub="vs benchmark"
                                    color={Math.abs(curveMetrics.beta - 1) < 0.3 ? 'text-slate-200' : 'text-amber-400'}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* ── Section D: Market Attribution ── */}
                {attribution && !attribution.error && (
                    <div>
                        <SectionHeader color="bg-amber-500" label="Market Attribution (OLS vs SPY)" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-3">
                            <Tile
                                label="Alpha (Ann.)"
                                value={`${sign(attribution.alpha_ann_pct)}${attribution.alpha_ann_pct.toFixed(2)}%`}
                                sub="Excess return vs SPY"
                                color={attribution.alpha_ann_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                                large
                            />
                            <Tile
                                label="Market Beta"
                                value={attribution.beta_market.toFixed(2)}
                                sub="SPY exposure"
                                color={attribution.beta_market < 0.5 ? 'text-violet-400' : attribution.beta_market > 1.2 ? 'text-rose-400' : 'text-slate-100'}
                                large
                            />
                            <Tile
                                label="R-Squared"
                                value={`${(attribution.r_squared * 100).toFixed(1)}%`}
                                sub="Variance explained"
                            />
                            <Tile
                                label="Tracking Error"
                                value={`${attribution.tracking_error_pct.toFixed(2)}%`}
                                sub="Ann. active risk"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                            <Tile
                                label="Info Ratio (OLS)"
                                value={attribution.information_ratio.toFixed(2)}
                                sub="Alpha / Tracking Error"
                                color={attribution.information_ratio >= 0.5 ? 'text-emerald-400' : attribution.information_ratio >= 0 ? 'text-slate-200' : 'text-rose-400'}
                            />
                            <Tile
                                label="Win Rate"
                                value={`${attribution.win_rate_pct.toFixed(1)}%`}
                                sub={`${attribution.n_observations.toLocaleString()} trading days`}
                                color={attribution.win_rate_pct >= 52 ? 'text-emerald-400' : 'text-slate-300'}
                            />
                        </div>
                    </div>
                )}

                {/* ── Section E: Factor Attribution (Fama-French proxies) ── */}
                {attribution && !attribution.error && (
                    <div>
                        <SectionHeader color="bg-blue-500" label="Factor Attribution (Fama-French Proxies)" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            {/* Size Factor */}
                            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">
                                            Size Factor β<sub>SMB</sub>
                                        </p>
                                        <p className={`text-2xl font-black mt-0.5 ${
                                            attribution.beta_size > 0.1 ? 'text-violet-400'
                                                : attribution.beta_size < -0.1 ? 'text-amber-400'
                                                : 'text-slate-300'
                                        }`}>
                                            {sign(attribution.beta_size)}{attribution.beta_size.toFixed(3)}
                                        </p>
                                    </div>
                                    <span className={`text-[0.6rem] uppercase font-black px-2 py-1 rounded-md mt-1 ${
                                        attribution.beta_size > 0.1 ? 'bg-violet-500/20 text-violet-400'
                                            : attribution.beta_size < -0.1 ? 'bg-amber-500/20 text-amber-400'
                                            : 'bg-slate-800 text-slate-500'
                                    }`}>
                                        {attribution.beta_size > 0.1 ? 'Small-Cap Tilt'
                                            : attribution.beta_size < -0.1 ? 'Large-Cap Tilt'
                                            : 'Cap-Neutral'}
                                    </span>
                                </div>
                                <p className="text-[0.65rem] text-slate-500 leading-relaxed">
                                    Proxy: IWM − SPY (Russell 2000 vs S&P 500).
                                    {attribution.beta_size > 0.1
                                        ? ' Positive beta indicates this strategy tilts toward smaller companies.'
                                        : attribution.beta_size < -0.1
                                        ? ' Negative beta indicates a large-cap bias relative to the market.'
                                        : ' Near-zero beta suggests cap-neutral exposure.'}
                                </p>
                            </div>

                            {/* Value Factor */}
                            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">
                                            Value Factor β<sub>HML</sub>
                                        </p>
                                        <p className={`text-2xl font-black mt-0.5 ${
                                            attribution.beta_value > 0.1 ? 'text-amber-400'
                                                : attribution.beta_value < -0.1 ? 'text-blue-400'
                                                : 'text-slate-300'
                                        }`}>
                                            {sign(attribution.beta_value)}{attribution.beta_value.toFixed(3)}
                                        </p>
                                    </div>
                                    <span className={`text-[0.6rem] uppercase font-black px-2 py-1 rounded-md mt-1 ${
                                        attribution.beta_value > 0.1 ? 'bg-amber-500/20 text-amber-400'
                                            : attribution.beta_value < -0.1 ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-slate-800 text-slate-500'
                                    }`}>
                                        {attribution.beta_value > 0.1 ? 'Value Tilt'
                                            : attribution.beta_value < -0.1 ? 'Growth Tilt'
                                            : 'Style-Neutral'}
                                    </span>
                                </div>
                                <p className="text-[0.65rem] text-slate-500 leading-relaxed">
                                    Proxy: IVE − IVW (S&P 500 Value vs S&P 500 Growth).
                                    {attribution.beta_value > 0.1
                                        ? ' Positive beta indicates value/cheap-stock exposure.'
                                        : attribution.beta_value < -0.1
                                        ? ' Negative beta indicates growth/momentum stock exposure.'
                                        : ' Near-zero beta suggests style-neutral positioning.'}
                                </p>
                            </div>
                        </div>

                        {/* OLS model quality note */}
                        <p className="text-[0.62rem] text-slate-600 mt-3 leading-relaxed">
                            OLS regression: r = α + β<sub>mkt</sub>·SPY + β<sub>size</sub>·(IWM−SPY) + β<sub>value</sub>·(IVE−IVW) + ε &nbsp;|&nbsp;
                            R² = {(attribution.r_squared * 100).toFixed(1)}% &nbsp;|&nbsp;
                            n = {attribution.n_observations.toLocaleString()} daily observations
                        </p>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
