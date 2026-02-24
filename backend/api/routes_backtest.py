from fastapi import APIRouter
from services.data_loader import get_strategy_metrics, get_raw_returns_series, load_combined_equity_curve, compute_factor_attribution, DATA_STORE
import numpy as np
import os

router = APIRouter()

@router.get("/debug")
def debug_paths():
    files = os.listdir(DATA_STORE) if os.path.exists(DATA_STORE) else []
    return {"data_store_path": DATA_STORE, "exists": os.path.exists(DATA_STORE), "files": files}

@router.get("/metrics")
def get_metrics():
    return get_strategy_metrics()

@router.get("/equity-curve/{strategy_id}")
def get_equity_curve(strategy_id: str):
    """Serves the merged Cumulative Returns and Alpha Metrics for the LineChart component."""
    return load_combined_equity_curve(strategy_id)

def calculate_trailing_stats(returns_series, periods_in_year=252):
    """Helper to calculate trailing performance and volatility."""
    if len(returns_series) == 0: 
        return {"performance_pct": 0.0, "volatility_pct": 0.0, "is_annualized": False}
    
    # Calculate geometric compounded end value
    compound_multiplier = np.exp(returns_series.sum())
    
    # Cumulative return percentage
    cum_ret = (compound_multiplier - 1) * 100
    
    # Annualized Volatility
    volatility = returns_series.std() * np.sqrt(periods_in_year) * 100
    if np.isnan(volatility): 
        volatility = 0.0
    
    # Determine precise mathematical years
    years = len(returns_series) / periods_in_year
    
    if years > 1.0:
        # Standard CAGR Formula: (Ending/Beginning)^(1/Years) - 1
        # Since Beginning is 1, and Ending is compound_multiplier, this reduces to:
        ann_ret = (compound_multiplier ** (1 / years) - 1) * 100
        return {"performance_pct": round(ann_ret, 2), "volatility_pct": round(volatility, 2), "is_annualized": True}
        
    return {"performance_pct": round(cum_ret, 2), "volatility_pct": round(volatility, 2), "is_annualized": False}

@router.get("/strategy/{strategy_id}/performance")
async def get_strategy_performance(strategy_id: str):
    """
    Returns trailing performance (1D, 1W, 1M, 1Q, 1Y, 3Y, 5Y, 10Y, Max)
    """
    raw_series = get_raw_returns_series(strategy_id)
    if raw_series.empty:
        return {"error": "Data not found"}
        
    # Standard trailing periods in trading days
    trailing_periods = {
        "1 Day": 1,
        "1 Week": 5,
        "1 Month": 21,
        "1 Quarter": 63,
        "1 Year": 252,
        "3 Years": 252 * 3,
        "5 Years": 252 * 5,
        "10 Years": 252 * 10,
        "Max": len(raw_series)
    }
    
    response_data = []
    for period_name, days in trailing_periods.items():
        if days > len(raw_series) and period_name != "Max":
            continue # Skip periods longer than available history
            
        slice_data = raw_series.iloc[-days:] if days <= len(raw_series) else raw_series
        stats = calculate_trailing_stats(slice_data)
        
        response_data.append({
            "period": period_name,
            "performance": stats["performance_pct"],
            "volatility": stats["volatility_pct"],
            "is_annualized": stats["is_annualized"]
        })
        
    return {"performance_analysis": response_data}


@router.get("/strategy/{strategy_id}/attribution")
def get_strategy_attribution(strategy_id: str):
    """
    OLS Factor Attribution: r = alpha + beta_mkt*SPY + beta_size*(IWM-SPY) + beta_value*(IVE-IVW)
    Returns annualized alpha, market/size/value betas, R², tracking error, information ratio.
    """
    result = compute_factor_attribution(strategy_id)
    if not result:
        return {"error": "Attribution data unavailable", "strategy_id": strategy_id}
    return result
