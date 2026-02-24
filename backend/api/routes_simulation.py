from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np

router = APIRouter()

class SimulationRequest(BaseModel):
    initial_investment: float
    monthly_contribution: float
    cagr: float
    volatility: float
    base_cagr: float | None = None
    base_volatility: float | None = None
    years: int = 10

def _run_gbm(initial, contribution, cagr, vol, years, num_simulations=1000):
    months = years * 12
    dt = 1/12.0
    mu = cagr / 100.0
    sigma = vol / 100.0
    
    drift = (mu - 0.5 * sigma**2) * dt
    shock = sigma * np.sqrt(dt) * np.random.normal(0, 1, size=(num_simulations, months))
    monthly_returns = np.exp(drift + shock)
    
    portfolio_paths = np.zeros((num_simulations, months + 1))
    portfolio_paths[:, 0] = initial
    
    for m in range(1, months + 1):
        portfolio_paths[:, m] = (portfolio_paths[:, m-1] + contribution) * monthly_returns[:, m-1]
        
    p10 = np.percentile(portfolio_paths, 10, axis=0)
    p50 = np.percentile(portfolio_paths, 50, axis=0)
    p90 = np.percentile(portfolio_paths, 90, axis=0)
    return p10, p50, p90

@router.post("/simulate")
async def run_monte_carlo(req: SimulationRequest):
    """
    Generates a probabilistic wealth projection based on Geometric Brownian Motion.
    Returns the 10th, 50th, and 90th percentiles for both target and base strategies.
    """
    months = req.years * 12
    
    # Run primary simulation
    tgt_p10, tgt_p50, tgt_p90 = _run_gbm(
        req.initial_investment, req.monthly_contribution, req.cagr, req.volatility, req.years
    )
    
    # Run secondary simulation if requested
    has_base = req.base_cagr is not None and req.base_volatility is not None
    if has_base:
        base_p10, base_p50, base_p90 = _run_gbm(
            req.initial_investment, req.monthly_contribution, req.base_cagr, req.base_volatility, req.years
        )
    
    # Format for Recharts (Next.js)
    chart_data = []
    for m in range(months + 1):
        point = {
            "month": m,
            "pessimistic": float(round(tgt_p10[m], 2)),
            "expected": float(round(tgt_p50[m], 2)),
            "optimistic": float(round(tgt_p90[m], 2))
        }
        if has_base:
            point["base_pessimistic"] = float(round(base_p10[m], 2))
            point["base_expected"] = float(round(base_p50[m], 2))
            point["base_optimistic"] = float(round(base_p90[m], 2))
        chart_data.append(point)
        
    return {"projection": chart_data}
