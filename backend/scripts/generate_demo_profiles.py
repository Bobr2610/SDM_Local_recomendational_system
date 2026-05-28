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
SAMPLE_QUANTILES = [0.01, 0.20, 0.70, 0.99]
PROFILE_NAMES = ["Матвей", "Артем", "Даниил", "Михаил"]
MODEL_INCOME_UNIT = "EUR/year"
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


def build_profile(row: pd.Series, target_quantile: float, profile_name: str, income_distribution: pd.Series) -> dict:
    model_income_eur_year = float(row["income_filled"])
    balance, balance_source = balance_proxy(row)
    owned = [product for product in PRODUCTS if product in row.index and float(row[product]) > 0]
    sex_raw = str(row["sex"])
    sex_num = 1 if sex_raw.upper() == "M" else 0
    segment = str(row["segment"])
    age = int(round(float(row["age"])))
    seniority = int(round(float(row["seniority_months"])))
    is_new = int(round(float(row["is_new_customer"])))
    quantile = float((income_distribution <= model_income_eur_year).mean())
    target_income_eur_year = float(income_distribution.quantile(target_quantile))
    selection_delta = abs(model_income_eur_year - target_income_eur_year)
    quantile_label = int(round(target_quantile * 100))
    return {
        "id": f"user-{int(row['user_id'])}",
        "name": profile_name,
        "sourceUserId": int(row["user_id"]),
        "targetIncomeQuantile": target_quantile,
        "targetIncomeEurYear": round(target_income_eur_year, 2),
        "modelIncomeEurYear": round(model_income_eur_year, 2),
        "rawIncome": {
            "field": "income_filled",
            "value": round(model_income_eur_year, 2),
            "unit": MODEL_INCOME_UNIT,
        },
        "incomeQuantile": round(quantile, 4),
        "selectionReason": (
            f"Nearest real client to target p{quantile_label:02d} income quantile; "
            f"delta {selection_delta:,.2f} EUR/year."
        ).replace(",", " "),
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
        "description": f"Реальный клиент из датасета, выбранный рядом с p{quantile_label:02d} дохода.",
        "characteristics": pick_icon_tags(segment, model_income_eur_year, owned),
    }


def ts_source(profiles: list[dict]) -> str:
    payload = json.dumps(profiles, ensure_ascii=False, indent=2)
    return (
        "/* AUTO-GENERATED — do not edit. Run: python backend/scripts/generate_demo_profiles.py */\n"
        f"export const DEMO_PROFILES = {payload} as const\n"
    )


def public_profile(profile: dict) -> dict:
    """Return the UI payload. Raw income/audit details stay in demo_profiles.json."""
    public = {
        key: value
        for key, value in profile.items()
        if key not in {"rawIncome", "selectionReason"}
    }
    public["scoringIncome"] = profile["modelIncomeEurYear"]
    return public


def main() -> None:
    dataset = find_dataset()
    usecols = ["user_id", "sex", "age", "is_new_customer", "seniority_months", "region_name", "segment", "income_filled", "income_lag_90"]
    present_cols = pd.read_csv(dataset, nrows=0).columns.tolist()
    usecols = [col for col in usecols if col in present_cols] + [col for col in PRODUCTS if col in present_cols]
    df = pd.read_csv(dataset, usecols=usecols, low_memory=False)
    df = df.dropna(subset=["income_filled", "age", "sex", "seniority_months", "is_new_customer", "segment", "region_name"]).copy()
    model_income_eur_year = df["income_filled"].astype(float)

    profiles = []
    for target_quantile, profile_name in zip(SAMPLE_QUANTILES, PROFILE_NAMES, strict=True):
        target_income_eur_year = float(model_income_eur_year.quantile(target_quantile))
        male_df = df[df["sex"].astype(str).str.upper() == "M"]
        if male_df.empty:
            raise SystemExit("No male clients found for named demo profiles")
        male_income = male_df["income_filled"].astype(float)
        idx = (male_income - target_income_eur_year).abs().idxmin()
        profiles.append(build_profile(df.loc[idx], target_quantile, profile_name, model_income_eur_year))
    public_profiles = [public_profile(profile) for profile in profiles]

    audit = {
        "sourceDataset": str(dataset.relative_to(ROOT)).replace("\\", "/"),
        "displayCurrency": MODEL_INCOME_UNIT,
        "modelIncomeUnit": MODEL_INCOME_UNIT,
        "sampleQuantiles": SAMPLE_QUANTILES,
        "incomeQuantileSummary": {
            f"p{int(q * 100):02d}": round(float(model_income_eur_year.quantile(q)), 2)
            for q in SAMPLE_QUANTILES
        },
        "maxAvailableIncomeEurYear": round(float(model_income_eur_year.max()), 2),
        "profiles": profiles,
    }

    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_FIXTURES.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(ts_source(public_profiles), encoding="utf-8")
    OUT_JSON.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_FIXTURES.write_text(json.dumps(public_profiles, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT_TS}")
    print(f"wrote {OUT_JSON}")
    print(f"wrote {OUT_FIXTURES}")


if __name__ == "__main__":
    main()
