import pandas as pd
import os
import numpy as np

# Bind to Docker persistent volume path if present, otherwise calculate local path dynamically
_local_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data_store")
DATA_STORE = os.getenv("DATA_STORE_PATH", _local_path)

# Current US risk-free rate (approximate Fed Funds / T-Bill yield).
RISK_FREE_RATE = 0.04  # 4.0% annualized

# ── 6-Model taxonomy ──────────────────────────────────────────────────────────
STRATEGY_NAMES = {
    "sector_rotation": "Multiscale Sector Rotation",
    "large_cap_100":   "Multiscale Large Cap 100",
    "mag7_momentum":   "Multiscale Mag 7",
    "stgt_ensemble":   "STGT Ensemble",
    "risk_parity":     "Multi-Horizon Risk Parity",
    "quality_factor":  "S&P 500 Quality",
}

# Each strategy file + its comparison baseline for the equity-curve overlay
STRATEGY_FILES = {
    "sector_rotation": ("backtest_Sector_Rotation.csv",  "backtest_Risk_Parity.csv"),
    "large_cap_100":   ("backtest_Large_Cap_100.csv",    "backtest_Risk_Parity.csv"),
    "mag7_momentum":   ("backtest_Mag7_Momentum.csv",    "backtest_Risk_Parity.csv"),
    "stgt_ensemble":   ("backtest_STGT_Ensemble.csv",    "backtest_Sector_Rotation.csv"),
    "risk_parity":     ("backtest_Risk_Parity.csv",      "backtest_Risk_Parity.csv"),
    "quality_factor":  ("backtest_Quality_Factor.csv",   "backtest_Risk_Parity.csv"),
}


def get_strategy_metrics():
    """Dynamically calculates CAGR, Vol, Sharpe, MaxDD, YTD for all 6 models."""

    def _calc(returns):
        if returns.empty:
            return 0.0, 0.0, 0.0, 0.0, 0.0
        cm = np.exp(returns.sum())
        yrs = len(returns) / 252.0
        cagr = (cm ** (1 / yrs) - 1) * 100 if yrs > 0 else 0

        ann_vol = returns.std() * np.sqrt(252)
        ann_ret_approx = returns.mean() * 252
        sharpe = (ann_ret_approx - RISK_FREE_RATE) / ann_vol if ann_vol > 0 else 0

        cum_ret = np.exp(returns.cumsum())
        max_dd = (cum_ret / cum_ret.cummax() - 1).min() * 100

        current_year = returns.index[-1].year
        ytd_returns = returns[returns.index.year == current_year]
        ytd = (np.exp(ytd_returns.sum()) - 1) * 100 if not ytd_returns.empty else 0.0

        return round(cagr, 2), round(ann_vol * 100, 2), round(sharpe, 2), round(max_dd, 2), round(ytd, 2)

    metrics_dict = {}
    for key, name in STRATEGY_NAMES.items():
        ret = get_raw_returns_series(key)
        c, v, s, d, y = _calc(ret)
        metrics_dict[key] = {"name": name, "cagr": c, "volatility": v, "sharpe": s, "max_dd": d, "ytd": y}
    return metrics_dict


def _load_raw_df(filename: str):
    path = os.path.join(DATA_STORE, filename)
    if not os.path.exists(path):
        return pd.DataFrame()
    df = pd.read_csv(path, index_col=0, parse_dates=True)
    if "0" in df.columns:
        df.rename(columns={"0": "Return"}, inplace=True)
    elif len(df.columns) > 0:
        df.rename(columns={df.columns[0]: "Return"}, inplace=True)
    df["Return"] = df["Return"].astype(float)
    return df


def get_raw_returns_series(strategy_id: str):
    """Returns the raw Pandas Series of log-returns for a strategy."""
    files = STRATEGY_FILES.get(strategy_id)
    if not files:
        return pd.Series(dtype=float)
    df = _load_raw_df(files[0])
    if df.empty:
        return pd.Series(dtype=float)
    return df["Return"]


def load_combined_equity_curve(strategy_id: str):
    """
    Returns merged cumulative returns timeseries + advanced metrics
    for the ChartInteractive.tsx component.
    """
    files = STRATEGY_FILES.get(strategy_id, STRATEGY_FILES["sector_rotation"])
    target_file, base_file = files

    df_stgt = _load_raw_df(target_file)
    df_base = _load_raw_df(base_file)

    if df_stgt.empty or df_base.empty:
        return {"timeseries": [], "metrics": {}}

    df_stgt["Cumulative"] = np.exp(df_stgt["Return"].cumsum()) - 1
    df_base["Cumulative"] = np.exp(df_base["Return"].cumsum()) - 1

    target_returns = df_stgt["Return"].copy()
    base_returns = df_base["Return"].copy()
    min_len = min(len(target_returns), len(base_returns))
    target_returns = target_returns.iloc[:min_len]
    base_returns = base_returns.iloc[:min_len]

    ann_vol = target_returns.std() * np.sqrt(252)
    ann_ret = target_returns.mean() * 252

    sharpe = (ann_ret - RISK_FREE_RATE) / ann_vol if ann_vol > 0 else 0

    downside_returns = target_returns[target_returns < 0]
    downside_vol = downside_returns.std() * np.sqrt(252)
    sortino = (ann_ret - RISK_FREE_RATE) / downside_vol if downside_vol > 0 else 0

    active_returns = target_returns - base_returns
    tracking_error = active_returns.std() * np.sqrt(252)
    ann_active_ret = active_returns.mean() * 252
    ir = ann_active_ret / tracking_error if tracking_error > 0 else 0

    cum_ret = np.exp(target_returns.cumsum())
    running_max = cum_ret.cummax()
    drawdown = (cum_ret / running_max) - 1
    max_dd_val = drawdown.min()
    calmar = ann_ret / abs(max_dd_val) if max_dd_val < 0 else 0

    is_dd = drawdown < 0
    dd_duration = is_dd.groupby((~is_dd).cumsum()).sum()
    max_dd_duration = int(dd_duration.max()) if not dd_duration.empty else 0

    cov_matrix = np.cov(target_returns, base_returns)
    beta = cov_matrix[0, 1] / cov_matrix[1, 1] if cov_matrix[1, 1] > 0 else 1
    base_ann_ret = base_returns.mean() * 252
    alpha = ann_ret - base_ann_ret

    metrics = {
        "sharpe":             float(round(sharpe, 2)),
        "sortino":            float(round(sortino, 2)),
        "calmar":             float(round(calmar, 2)),
        "information_ratio":  float(round(ir, 2)),
        "alpha_pct":          float(round(alpha * 100, 2)),
        "beta":               float(round(beta, 2)),
        "max_dd_duration":    max_dd_duration,
    }

    df_combined = pd.DataFrame(index=df_stgt.index)
    df_combined["STGT"] = df_stgt["Cumulative"]
    df_combined["Baseline"] = df_base["Cumulative"].reindex(df_stgt.index).fillna(method="ffill")
    df_combined["Relative"] = ((1 + df_combined["STGT"]) / (1 + df_combined["Baseline"])) - 1
    df_combined = df_combined.reset_index()

    if "Date" in df_combined.columns:
        df_combined.rename(columns={"Date": "date"}, inplace=True)
    elif "index" in df_combined.columns:
        df_combined.rename(columns={"index": "date"}, inplace=True)

    df_combined["date"] = pd.to_datetime(df_combined["date"]).dt.strftime("%Y-%m-%d")
    df_combined.replace([np.inf, -np.inf, np.nan], 0, inplace=True)

    return {"timeseries": df_combined.to_dict(orient="records"), "metrics": metrics}
