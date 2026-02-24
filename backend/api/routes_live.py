from fastapi import APIRouter
from datetime import datetime
import random
from services.data_loader import get_strategy_metrics

router = APIRouter()

@router.get("/status")
def get_live_status():
    """Mock live update server to realistically display daily ticker activity."""
    return {
        "status": "LIVE",
        "last_execution": datetime.now().isoformat(),
        "next_rebalance": "16:00 EST",
        "active_trades": random.randint(1, 11)
    }

@router.get("/stats/{strategy_id}")
def get_live_metrics(strategy_id: str):
    """Provides the live metrics for the LiveStatsBanner component."""
    metrics = get_strategy_metrics()
    
    if not metrics or strategy_id not in metrics:
        return {"error": "Strategy not found", "status": "OFFLINE"}
        
    strat_data = metrics.get(strategy_id, {})
    return {
        "last_updated": datetime.now().strftime("%Y-%m-%d"),
        "ytd_return": strat_data.get("ytd", 0.0),
        "current_drawdown": strat_data.get("max_dd", 0.0),
        "rolling_30d_vol": strat_data.get("volatility", 0.0),
        "status": "LIVE"
    }
