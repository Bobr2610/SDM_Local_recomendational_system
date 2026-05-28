"""
Generate four reproducible demo profiles from real data for the web UI.

Input priority:
  1. ./train_wide_filled_lags.csv
  2. backend/datasets/raw/train_wide_with_lags.csv
  3. backend/datasets/raw/train_wide_new.csv
  4. backend/datasets/raw/train_wide.csv

Outputs:
  frontend/src/features/profiles/demoProfiles.generated.ts
  backend/datasets/processed/demo_profiles.json
  frontend/src/model/__fixtures__/profiles.json
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
PRODUCTS = [
    "dep-7",
    "card-2",
    "dep-5",
    "card-1",
    "card-5",
    "rko-2",
    "rko-3",
    "rko-4",
    "dep-9",
    "dep-1",
    "dep-3",
    "rko-1",
    "dep-2",
    "loan-2",
    "card-4",
    "loan-1",
    "srv-3",
    "loan-5",
    "biz-4",
    "dep-6",
    "loan-4",
    "card-3",
]
DATA_CANDIDATES = [
    ROOT / "train_wide_filled_lags.csv",
    ROOT / "backend" / "datasets" / "raw" / "train_wide_with_lags.csv",
    ROOT / "backend" / "datasets" / "raw" / "train_wide_new.csv",
    ROOT / "backend" / "datasets" / "raw" / "train_wide.csv",
]
TARGETS = [15_000, 100_000, 500_000, 5_000_000]
RUB_PER_EUR = 100.0
OUT_TS = ROOT / "frontend" / "src" / "features" / "profiles" / "demoProfiles.generated.ts"
OUT_JSON = ROOT / "backend" / "datasets" / "processed" / "demo_profiles.json"
OUT_FIXTURES = ROOT / "frontend" / "src" / "model" / "__fixtures__" / "profiles.json"


def find_dataset() -> Path:
    for path in DATA_CANDIDATES:
        if path.exists():
            return path
    raise SystemExit("No dataset found for demo profiles")


def infer_segment_label(segment: str) -> str:
    return {
        "STUDENTS": "Студент",
        "VIP": "Премиум",
        "INDIVIDUALS": "Частный клиент",
    }.get(segment, "Клиент банка")


def annual_eur_to_rub_monthly(annual_eur: float, rate: float = RUB_PER_EUR) -> float:
    return annual_eur * rate / 12.0


def pick_icon_tags(segment: str, income: float, owned: list[str]) -> list[str]:
    tags = []
    if segment == "STUDENTS":
        tags.append("Стартовый доход")
    elif income >= 500_000:
        tags.append("Высокий доход")
    else:
        tags.append("Стабильный доход")

    if any(p.startswith("loan-") for p in owned):
        tags.append("Есть кредитные продукты")
    if any(p.startswith("dep-") for p in owned):
        tags.append("Есть сбережения")
    if any(p.startswith("rko-") or p.startswith("biz-") for p in owned):
        tags.append("Есть бизнес-продукты")
    if len(tags) < 3:
        tags.append("Профиль из реального датасета")
    return tags[:4]


def balance_proxy(row: pd.Series) -> tuple[float, str]:
    if "balance" in row.index and pd.notna(row["balance"]):
        return float(row["balance"]), "balance"
    if "lag_90" in row.index and pd.notna(row["lag_90"]):
        return float(row["lag_90"]), "lag_90"
    if "income_lag_90" in row.index and pd.notna(row["income_lag_90"]):
        return float(row["income_lag_90"]), "income_lag_90_proxy"
    return float(row["income_filled"]) * 0.35, "income_share_proxy"


def build_profile(row: pd.Series, target_income: int, quantiles: pd.Series) -> dict:
    income_eur_year = float(row["income_filled"])
    display_income_rub_month = annual_eur_to_rub_monthly(income_eur_year)
    balance, balance_source = balance_proxy(row)
    owned = [product for product in PRODUCTS if product in row.index and float(row[product]) > 0]
    sex_raw = str(row["sex"])
    sex_num = 1 if sex_raw.upper() == "M" else 0
    segment = str(row["segment"])
    age = int(round(float(row["age"])))
    seniority = int(round(float(row["seniority_months"])))
    is_new = int(round(float(row["is_new_customer"])))
    quantile = float((quantiles <= income_eur_year).mean())
    return {
        "id": f"user-{int(row['user_id'])}",
        "name": f"Клиент {target_income // 1000}k",
        "sourceUserId": int(row["user_id"]),
        "targetMonthlyIncomeRub": target_income,
        "targetIncomeEurYear": round((target_income / RUB_PER_EUR) * 12.0, 2),
        "modelIncomeEurYear": round(income_eur_year, 2),
        "displayIncomeRubMonth": round(display_income_rub_month, 2),
        "incomeQuantile": round(quantile, 4),
        "age": age,
        "balance": round(balance, 2),
        "balanceSource": balance_source,
        "sex": sex_num,
        "sexLabel": "Мужчина" if sex_num == 1 else "Женщина",
        "seniorityMonths": seniority,
        "isNewCustomer": is_new,
        "segment": segment,
        "regionName": str(row["region_name"]),
        "ownedProducts": owned,
        "ownedProductFlags": {product: int(product in owned) for product in PRODUCTS},
        "info": infer_segment_label(segment),
        "description": f"Реальный клиент из датасета, выбранный рядом с уровнем дохода {target_income:,.0f} ₽/мес.".replace(",", " "),
        "characteristics": pick_icon_tags(segment, display_income_rub_month, owned),
    }


def ts_source(profiles: list[dict]) -> str:
    payload = json.dumps(profiles, ensure_ascii=False, indent=2)
    return (
        "/* AUTO-GENERATED — do not edit. Run: python backend/scripts/generate_demo_profiles.py */\n"
        f"export const DEMO_PROFILES = {payload} as const\n"
    )


def main() -> None:
    dataset = find_dataset()
    usecols = ["user_id", "sex", "age", "is_new_customer", "seniority_months", "region_name", "segment", "income_filled", "income_lag_90"]
    present_cols = pd.read_csv(dataset, nrows=0).columns.tolist()
    usecols = [col for col in usecols if col in present_cols] + [col for col in PRODUCTS if col in present_cols]
    df = pd.read_csv(dataset, usecols=usecols, low_memory=False)
    df = df.dropna(subset=["income_filled", "age", "sex", "seniority_months", "is_new_customer", "segment", "region_name"]).copy()
    quantiles = df["income_filled"].astype(float)

    profiles = []
    for target in TARGETS:
        target_eur_year = (target / RUB_PER_EUR) * 12.0
        idx = (df["income_filled"].astype(float) - target_eur_year).abs().idxmin()
        profiles.append(build_profile(df.loc[idx], target, quantiles))

    max_income = float(df["income_filled"].max())
    audit = {
        "sourceDataset": str(dataset.relative_to(ROOT)).replace("\\", "/"),
        "displayCurrency": "RUB/month",
        "modelIncomeUnit": "EUR/year",
        "rubPerEur": RUB_PER_EUR,
        "targets": TARGETS,
        "maxAvailableIncome": round(max_income, 2),
        "usedMaxInsteadOfTarget": max_income < TARGETS[-1],
        "profiles": profiles,
    }

    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_FIXTURES.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(ts_source(profiles), encoding="utf-8")
    OUT_JSON.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_FIXTURES.write_text(json.dumps(profiles, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT_TS}")
    print(f"wrote {OUT_JSON}")
    print(f"wrote {OUT_FIXTURES}")


if __name__ == "__main__":
    main()
