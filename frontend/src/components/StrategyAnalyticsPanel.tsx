"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../lib/api';

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
    beta_profitability?: number;  // RMW — FF5
    beta_momentum?: number;       // MOM — FF5
    r_squared: number;
    tracking_error_pct: number;
    information_ratio: number;
    win_rate_pct: number;
    n_observations: number;
    factor_model?: string;        // "FF5" | "FF3"
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

function SectionHeader({ color, label }: { color: string; label: React.ReactNode }) {
    return (
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
            {label}
        </h4>
    );
}

function sign(n: number) { return n >= 0 ? '+' : ''; }

// Reusable factor attribution card
function FactorCard({
    label, value, threshold,
    posLabel, negLabel, neutLabel,
    posColor, negColor,
    posRing, negRing,
    proxy, posDesc, negDesc, neutDesc,
}: {
    label: React.ReactNode;
    value: number;
    threshold: number;
    posLabel: string; negLabel: string; neutLabel: string;
    posColor: string; negColor: string;
    posRing: string;  negRing: string;
    proxy: string;
    posDesc: string; negDesc: string; neutDesc: string;
}) {
    const isPos  = value >  threshold;
    const isNeg  = value < -threshold;
    const valColor  = isPos ? posColor : isNeg ? negColor : 'text-slate-300';
    const badgeRing = isPos ? posRing  : isNeg ? negRing  : 'bg-slate-800';
    const badgeTxt  = isPos ? posColor : isNeg ? negColor : 'text-slate-500';
    const badge     = isPos ? posLabel : isNeg ? negLabel : neutLabel;
    const desc      = isPos ? posDesc  : isNeg ? negDesc  : neutDesc;
    return (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <p className="text-[0.6rem] uppercase text-slate-500 font-bold tracking-widest">{label}</p>
                    <p className={`text-2xl font-black mt-0.5 ${valColor}`}>
                        {sign(value)}{value.toFixed(3)}
                    </p>
                </div>
                <span className={`text-[0.6rem] uppercase font-black px-2 py-1 rounded-md mt-1 ${badgeRing} ${badgeTxt}`}>
                    {badge}
                </span>
            </div>
            <p className="text-[0.65rem] text-slate-500 leading-relaxed">
                Proxy: {proxy}. {desc}
            </p>
        </div>
    );
}

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
        Promise.all([
            fetch(`${API_URL}/api/v1/backtest/strategy/${strategyId}/performance`).then(r => r.json()),
            fetch(`${API_URL}/api/v1/backtest/equity-curve/${strategyId}`).then(r => r.json()),
            fetch(`${API_URL}/api/v1/backtest/strategy/${strategyId}/attribution`).then(r => r.json()),
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

                {/* ── Section E: Factor Attribution (FF5 proxies) ── */}
                {attribution && !attribution.error && (
                    <div>
                        <SectionHeader
                            color="bg-blue-500"
                            label={`Factor Attribution (${attribution.factor_model ?? 'FF5'} Proxies)`}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">

                            {/* Size Factor β_SMB */}
                            <FactorCard
                                label={<>Size Factor β<sub>SMB</sub></>}
                                value={attribution.beta_size}
                                threshold={0.1}
                                posLabel="Small-Cap Tilt" negLabel="Large-Cap Tilt" neutLabel="Cap-Neutral"
                                posColor="text-violet-400" posRing="bg-violet-500/20"
                                negColor="text-amber-400"  negRing="bg-amber-500/20"
                                proxy="IWM − SPY (Russell 2000 vs S&P 500)"
                                posDesc="Positive beta indicates a tilt toward smaller companies."
                                negDesc="Negative beta indicates a large-cap bias vs the market."
                                neutDesc="Near-zero beta suggests cap-neutral exposure."
                            />

                            {/* Value Factor β_HML */}
                            <FactorCard
                                label={<>Value Factor β<sub>HML</sub></>}
                                value={attribution.beta_value}
                                threshold={0.1}
                                posLabel="Value Tilt" negLabel="Growth Tilt" neutLabel="Style-Neutral"
                                posColor="text-amber-400" posRing="bg-amber-500/20"
                                negColor="text-blue-400"  negRing="bg-blue-500/20"
                                proxy="IVE − IVW (S&P 500 Value vs S&P 500 Growth)"
                                posDesc="Positive beta indicates value / cheap-stock exposure."
                                negDesc="Negative beta indicates growth / momentum stock exposure."
                                neutDesc="Near-zero beta suggests style-neutral positioning."
                            />

                            {/* Profitability Factor β_RMW — only if FF5 data available */}
                            {attribution.beta_profitability !== undefined && (
                                <FactorCard
                                    label={<>Profitability Factor β<sub>RMW</sub></>}
                                    value={attribution.beta_profitability}
                                    threshold={0.05}
                                    posLabel="Quality Tilt" negLabel="Speculative Tilt" neutLabel="Profitability-Neutral"
                                    posColor="text-emerald-400" posRing="bg-emerald-500/20"
                                    negColor="text-rose-400"    negRing="bg-rose-500/20"
                                    proxy="QUAL − SPY (iShares MSCI USA Quality vs S&P 500)"
                                    posDesc="Positive beta indicates a tilt toward highly profitable, high-ROE companies."
                                    negDesc="Negative beta indicates exposure to lower-profitability or speculative names."
                                    neutDesc="Near-zero beta suggests profitability-neutral exposure."
                                />
                            )}

                            {/* Momentum Factor β_MOM — only if FF5 data available */}
                            {attribution.beta_momentum !== undefined && (
                                <FactorCard
                                    label={<>Momentum Factor β<sub>MOM</sub></>}
                                    value={attribution.beta_momentum}
                                    threshold={0.05}
                                    posLabel="Momentum Tilt" negLabel="Contrarian Tilt" neutLabel="Momentum-Neutral"
                                    posColor="text-cyan-400"  posRing="bg-cyan-500/20"
                                    negColor="text-orange-400" negRing="bg-orange-500/20"
                                    proxy="MTUM − SPY (iShares MSCI USA Momentum vs S&P 500)"
                                    posDesc="Positive beta indicates a tilt toward recent price winners."
                                    negDesc="Negative beta indicates a contrarian / mean-reversion bias."
                                    neutDesc="Near-zero beta suggests momentum-neutral positioning."
                                />
                            )}
                        </div>

                        {/* OLS model quality note */}
                        <p className="text-[0.62rem] text-slate-600 mt-3 leading-relaxed">
                            OLS: r = α + β<sub>mkt</sub>·SPY + β<sub>SMB</sub>·(IWM−SPY) + β<sub>HML</sub>·(IVE−IVW)
                            {attribution.factor_model === 'FF5' && (
                                <> + β<sub>RMW</sub>·(QUAL−SPY) + β<sub>MOM</sub>·(MTUM−SPY)</>
                            )}
                            {' '}+ ε &nbsp;|&nbsp;
                            R² = {(attribution.r_squared * 100).toFixed(1)}% &nbsp;|&nbsp;
                            n = {attribution.n_observations.toLocaleString()} daily obs
                        </p>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
