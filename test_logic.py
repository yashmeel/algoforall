import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.data_loader import get_raw_returns_series
from api.routes_backtest import calculate_period_stats

# Mock test for Dynamic Alpha mapping
raw_series = get_raw_returns_series("dynamic_alpha")

if raw_series.empty:
    print("FAILED: Data Store empty or unmapped. Ensure relative pathing is correct.")
    sys.exit()

regimes = {
    "COVID_Crash": ("2020-02-19", "2020-03-23"),
    "Rate_Hike_Shock": ("2022-01-01", "2022-10-12")
}

for regime, (start, end) in regimes.items():
    try:
        slice_data = raw_series.loc[start:end]
        stats = calculate_period_stats(slice_data)
        print(f"[{regime}] Return: {stats['performance_pct']}%, Vol: {stats['volatility_pct']}%")
    except Exception as e:
        print(f"[{regime}] ERROR: {e}")
