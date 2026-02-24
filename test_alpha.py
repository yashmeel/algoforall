import sys
import os
import pandas as pd
import numpy as np
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ["DATA_STORE_PATH"] = os.path.join(os.path.dirname(__file__), "backend", "data_store")

from services.data_loader import _load_raw_df

df_stgt = _load_raw_df("backtest_Dynamic_Alpha.csv")
print("STGT Columns:", df_stgt.columns)
print("STGT Head:", df_stgt.head())

df_base = _load_raw_df("backtest_Horizon_Parity.csv")
print("Base Columns:", df_base.columns)
print("Base Head:", df_base.head())

target_returns = df_stgt["Return"]
base_returns = df_base["Return"]

cov_matrix = np.cov(target_returns, base_returns)
beta = cov_matrix[0, 1] / cov_matrix[1, 1] if cov_matrix[1, 1] > 0 else 1

df_combined = pd.DataFrame(index=df_stgt.index)
df_combined["STGT"] = (1 + df_stgt["Return"]).cumprod() - 1
df_combined["Baseline"] = (1 + df_base["Return"]).cumprod() - 1

df_combined = df_combined.reset_index()
print(df_combined.columns)
df_combined.rename(columns={"index": "date", "Date": "date"}, inplace=True)
df_combined["date"] = df_combined["date"].dt.strftime("%Y-%m-%d")

print("SUCCESS")
print(f"Beta: {beta}")
print(df_combined.head())
