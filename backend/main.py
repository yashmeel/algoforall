from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import routes_backtest, routes_simulation, routes_live

app = FastAPI(title="Quant Portal API", version="1.0.0")

# Allow Next.js frontend to communicate securely
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://algoforall.com",
    "https://www.algoforall.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_backtest.router, prefix="/api/v1/backtest", tags=["Backtest Analytics"])
app.include_router(routes_simulation.router, prefix="/api/v1/simulation", tags=["Monte Carlo Simulator"])
app.include_router(routes_live.router, prefix="/api/v1/live", tags=["Live Trading Updates"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Quant Engine is online"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
