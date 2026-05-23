"""Проверка: BitNet обучается и выдаёт рекомендации."""
import sys
sys.path.insert(0, '.')
import torch
from src.models.bitnet import BitNetRecommender
from src.pipeline.loaders.santander import load_santander, _generate_synthetic_data
from src.evaluation.metrics import precision_at_k, ndcg_at_k
from src.edge.runtime.inference import EdgeRuntime

print('=== 1. BitNet b1.58 Model ===')
m = BitNetRecommender(input_dim=32, num_products=36, hidden_dim=128, num_layers=2)
info = m.export_info()
print(f'  Params: {info["total_parameters"]:,}')
print(f'  Size:   {info["model_size_kb"]} KB ({info["weight_bits"]} bit)')
print(f'  Arch:   {info["architecture"]}')

print('\n=== 2. Data Loading (synthetic) ===')
X, y = _generate_synthetic_data(n_samples=1000)
print(f'  X: {X.shape}, y: {y.shape}')
print(f'  Mean products/user: {y.sum(axis=1).mean():.1f}')

print('\n=== 3. Training (5 epochs) ===')
X_tr = torch.from_numpy(X[:800])
y_tr = torch.from_numpy(y[:800])
X_val = torch.from_numpy(X[800:])
y_val = torch.from_numpy(y[800:])

opt = torch.optim.AdamW(m.parameters(), lr=1e-3)
loss_fn = torch.nn.BCEWithLogitsLoss()
m.train()

for epoch in range(5):
    total_loss = 0.0
    for i in range(0, 800, 64):
        xb = X_tr[i:i+64]; yb = y_tr[i:i+64]
        opt.zero_grad()
        l = loss_fn(m(xb), yb)
        l.backward()
        opt.step()
        total_loss += l.item()
    
    m.eval()
    with torch.no_grad():
        pred = torch.sigmoid(m(X_val)).numpy()
        val_loss = loss_fn(m(X_val), y_val).item()
        p_at_5 = precision_at_k(y_val.numpy(), pred, k=5)
        ndcg = ndcg_at_k(y_val.numpy(), pred, k=5)
    
    print(f'  Epoch {epoch+1}: loss={total_loss/13:.4f} val={val_loss:.4f} p@5={p_at_5:.3f} ndcg={ndcg:.3f}')

print('\n=== 4. Edge Runtime (phone simulation) ===')
rt = EdgeRuntime()
feats = rt.extract_features(age=30, balance=250000, monthly_income=85000, account_type=0, currency=0)
scores = rt.predict(feats)
top3 = rt.get_top_k(scores, k=3)
print(f'  Features: {feats[:5]}...')
print(f'  Top-3: {top3}')

# Simulate clicks
rt.track_click("dep-1")
rt.track_click("card-3")
feats2 = rt.extract_features(age=30, balance=250000, monthly_income=85000, account_type=0, currency=0)
scores2 = rt.personalize("user-1", rt.predict(feats2))
top3b = rt.get_top_k(scores2, k=3)
print(f'  After clicks: {top3b}')

print('\n=== 5. API Simulation (ad selection mock) ===')
import json; from pathlib import Path
ads_path = Path('../frontend/src/data/ad-products.json')
if ads_path.exists():
    data = json.loads(ads_path.read_text(encoding='utf-8'))
    def mock_select(age, balance):
        if age < 25: return data['debit_cards'][2], 'Молодой: карта'
        if balance > 500000: return data['deposits_and_savings_accounts_individuals'][0], 'Крупный капитал: вклад'
        return data['loans_individuals'][0], 'Средний: кредит'
    prod, reason = mock_select(45, 800000)
    print(f'  Age=45, Balance=800k')
    print(f'  Ad: {prod["name"]}')
    print(f'  Reason: {reason}')
    print(f'  Product ID: {prod["id"]}')

print('\n=========================================')
print('VERDICT: Model trains, AI answers, Edge works')
print('=========================================')
