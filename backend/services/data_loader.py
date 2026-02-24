import pandas as pd
import os
import numpy as np

# Bind to Docker persistent volume path if present, otherwise calculate local path dynamically
_local_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data_store")
DATA_STORE = os.getenv("DATA_STORE_PATH", _local_path)

# Current US risk-free rate (approximate Fed Funds / T-Bill yield).
# Update this periodically as rates change.
RISK_FREE_RATE = 0.04  # 4.0% annualized

def get_strategy_metrics():
    """Dynamically calculates the exact CAGR mathematically to match the Performance Table."""
    names = {
        "dynamic_alpha": "Dynamic Sector Alpha",
        "horizon_parity": "Multi-Horizon Parity",
        "mag7_multiscale": "Mag 7 Multiscale",
        "mag7_riskparity": "Mag 7 Risk Parity",
        "quality_factor": "S&P 500 Quality Factor"
    }
    
    def _calc(returns):
        if returns.empty: return 0.0, 0.0, 0.0, 0.0, 0.0
        cm = np.exp(returns.sum())
        yrs = len(returns) / 252.0
        cagr = (cm ** (1 / yrs) - 1) * 100 if yrs > 0 else 0
        
        # Volatility & Sharpe (risk-free rate adjusted)
        ann_vol = returns.std() * np.sqrt(252)
        ann_ret_approx = returns.mean() * 252
        sharpe = (ann_ret_approx - RISK_FREE_RATE) / ann_vol if ann_vol > 0 else 0
        
        # Max Drawdown
        cum_ret = np.exp(returns.cumsum())
        max_dd = (cum_ret / cum_ret.cummax() - 1).min() * 100
        
        # YTD Return
        current_year = returns.index[-1].year
        ytd_returns = returns[returns.index.year == current_year]
        if ytd_returns.empty: ytd = 0.0
        else: ytd = (np.exp(ytd_returns.sum()) - 1) * 100
        
        return round(cagr, 2), round(ann_vol * 100, 2), round(sharpe, 2), round(max_dd, 2), round(ytd, 2)
        
    metrics_dict = {}
    for key, name in names.items():
        ret = get_raw_returns_series(key)
        c, v, s, d, y = _calc(ret)
        metrics_dict[key] = {
            "name": name,
            "cagr": c,
            "volatility": v,
            "sharpe": s,
            "max_dd": d,
            "ytd": y
        }
    return metrics_dict

def _load_raw_df(filename: str):
    path = os.path.join(DATA_STORE, filename)
    if not os.path.exists(path):
        return pd.DataFrame()
    
    # Read CSV, assume first column is Date index
    df = pd.read_csv(path, index_col=0, parse_dates=True)
    
    # The STGT CSV generation outputs the index as "Date" and the data column as "0".
    if "0" in df.columns:
        df.rename(columns={"0": "Return"}, inplace=True)
    elif len(df.columns) > 0:
         # Fallback just in case
        df.rename(columns={df.columns[0]: "Return"}, inplace=True)
        
    df["Return"] = df["Return"].astype(float)
        
    return df

def get_raw_returns_series(strategy_id: str):
    """Returns the raw Pandas Series of returns for regime slicing."""
    filenames = {
        "dynamic_alpha": "backtest_Dynamic_Alpha.csv",
        "horizon_parity": "backtest_Horizon_Parity.csv",
        "mag7_multiscale": "backtest_Mag7_Multiscale.csv",
        "mag7_riskparity": "backtest_Mag7_RiskParity.csv",
        "quality_factor": "backtest_Quality_Factor.csv"
    }
    filename = filenames.get(strategy_id)
    if not filename:
         return pd.Series(dtype=float)
    df = _load_raw_df(filename)
    if df.empty:
        return pd.Series(dtype=float)
    return df["Return"]

def load_combined_equity_curve(strategy_id: str):
    """
    Returns a merged list of dicts mapped directly to Recharts for the ChartInteractive.tsx component,
    along with calculated advanced metrics (Sharpe, IR, Alpha).
    """
    filenames = {
        "dynamic_alpha": ("backtest_Dynamic_Alpha.csv", "backtest_Horizon_Parity.csv"),
        "horizon_parity": ("backtest_Horizon_Parity.csv", "backtest_Horizon_Parity.csv"),
        "mag7_multiscale": ("backtest_Mag7_Multiscale.csv", "backtest_Mag7_RiskParity.csv"),
        "mag7_riskparity": ("backtest_Mag7_RiskParity.csv", "backtest_Mag7_RiskParity.csv"),
        "quality_factor": ("backtest_Quality_Factor.csv", "backtest_Quality_Factor.csv")
    }
    target_file, base_file = filenames.get(strategy_id, filenames["dynamic_alpha"])
    
    df_stgt = _load_raw_df(target_file)
    df_base = _load_raw_df(base_file)
    
    if df_stgt.empty or df_base.empty:
        return {"timeseries": [], "metrics": {}}
        
    df_stgt["Cumulative"] = np.exp(df_stgt["Return"].cumsum()) - 1
    df_base["Cumulative"] = np.exp(df_base["Return"].cumsum()) - 1
    
    target_returns = df_stgt["Return"].copy()
    base_returns = df_base["Return"].copy()
    
    # Ensure they align
    min_len = min(len(target_returns), len(base_returns))
    target_returns = target_returns.iloc[:min_len]
    base_returns = base_returns.iloc[:min_len]
    
    # Annualized Volatility
    ann_vol = target_returns.std() * np.sqrt(252)
    # Annualized Return (arithmetic approximation, used for ratio numerators)
    ann_ret = target_returns.mean() * 252

    # 1. Sharpe Ratio (risk-free rate adjusted)
    sharpe = (ann_ret - RISK_FREE_RATE) / ann_vol if ann_vol > 0 else 0

    # 1.5 Sortino Ratio (downside risk only, risk-free rate adjusted)
    downside_returns = target_returns[target_returns < 0]
    downside_vol = downside_returns.std() * np.sqrt(252)
    sortino = (ann_ret - RISK_FREE_RATE) / downside_vol if downside_vol > 0 else 0
    
    # 2. Information Ratio (Active Return / Tracking Error)
    active_returns = target_returns - base_returns
    tracking_error = active_returns.std() * np.sqrt(252)
    ann_active_ret = active_returns.mean() * 252
    ir = ann_active_ret / tracking_error if tracking_error > 0 else 0
    
    # Calculate Max Drawdown & Duration
    cum_ret = np.exp(target_returns.cumsum())
    running_max = cum_ret.cummax()
    drawdown = (cum_ret / running_max) - 1
    max_dd_val = drawdown.min()
    
    # 2.5 Calmar Ratio (Annualized Return / Max Drawdown Magnitude)
    calmar = ann_ret / abs(max_dd_val) if max_dd_val < 0 else 0
    
    # Max Drawdown Duration (in Trading Days)
    # Find periods where drawdown is < 0, count length of longest streak
    is_dd = drawdown < 0
    dd_duration = is_dd.groupby((~is_dd).cumsum()).sum()
    max_dd_duration = int(dd_duration.max())
    
    # 3. Beta (market sensitivity) and Alpha (annualized active return over benchmark)
    cov_matrix = np.cov(target_returns, base_returns)
    beta = cov_matrix[0, 1] / cov_matrix[1, 1] if cov_matrix[1, 1] > 0 else 1
    # Alpha = annualized strategy return minus annualized benchmark return (active return)
    base_ann_ret = base_returns.mean() * 252
    alpha = ann_ret - base_ann_ret
    
    metrics = {
        "sharpe": float(round(sharpe, 2)),
        "sortino": float(round(sortino, 2)),
        "calmar": float(round(calmar, 2)),
        "information_ratio": float(round(ir, 2)),
        "alpha_pct": float(round(alpha * 100, 2)),
        "beta": float(round(beta, 2)),
        "max_dd_duration": max_dd_duration
    }

    
    # Merge on the shared datetime index for Recharts
    df_combined = pd.DataFrame(index=df_stgt.index)
    
    # Send BOTH curves to the frontend so they can be toggled/viewed together
    df_combined["STGT"] = df_stgt["Cumulative"]
    df_combined["Baseline"] = df_base["Cumulative"]
    
    # Add Relative Performance (Ratio of compounded growths minus 1)
    df_combined["Relative"] = ((1 + df_combined["STGT"]) / (1 + df_combined["Baseline"])) - 1
    
    # Format for JSON ingest
    df_combined = df_combined.reset_index()
    if "Date" in df_combined.columns:
        df_combined.rename(columns={"Date": "date"}, inplace=True)
    elif "index" in df_combined.columns:
        df_combined.rename(columns={"index": "date"}, inplace=True)
    
    df_combined["date"] = pd.to_datetime(df_combined["date"]).dt.strftime("%Y-%m-%d")
    df_combined.replace([np.inf, -np.inf, np.nan], 0, inplace=True)
    
    return {
        "timeseries": df_combined.to_dict(orient="records"),
        "metrics": metrics
    }
