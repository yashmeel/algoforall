import uvicorn
import threading
import time
import requests
from main import app

def run():
    uvicorn.run(app, host='127.0.0.1', port=8001, log_level='error')

threading.Thread(target=run, daemon=True).start()
time.sleep(2)
res = requests.get('http://127.0.0.1:8001/api/v1/backtest/strategy/dynamic_alpha/regimes')
print('HTTP Status:', res.status_code)
if res.status_code == 200:
    print('Regimes Payload:', res.json())
else:
    print('Response Text:', res.text)
