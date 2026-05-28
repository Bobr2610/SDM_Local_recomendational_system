"""
Generate frontend parity fixtures from the reference CatBoost model.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd
from catboost import CatBoostClassifier, Pool

ROOT = Path(__file__).resolve().parents[3]
BACKEND = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND))

from src.models.synthetic_from_profile import synthetic_from_profile  # noqa: E402

MODEL_META = ROOT / "frontend" / "public" / "model" / "catboost_model.json"
CBM = ROOT / "frontend" / "public" / "model" / "catboost_pointwise.cbm"
PROFILES = ROOT / "frontend" / "src" / "model" / "__fixtures__" / "profiles.json"
OUT = ROOT / "frontend" / "src" / "model" / "__fixtures__" / "expected_scores.json"


def build_frame(profile: dict, products: list[str]) -> pd.DataFrame:
    syn = synthetic_from_profile(profile["age"], profile["modelIncomeEurYear"], profile["balance"], profile["segment"])
    rows: list[dict[str, object]] = []
    for product in products:
        row: dict[str, object] = {
            "sex": "M" if profile["sex"] == 1 else "F",
            "age": float(profile["age"]),
            "is_new_customer": str(int(profile["isNewCustomer"])),
            "seniority_months": float(profile["seniorityMonths"]),
            "region_name": str(profile["regionName"]),
            "segment": str(profile["segment"]),
            "income_at_lag": float(profile["modelIncomeEurYear"]),
            "product": product,
            **syn,
        }
        owned = set(profile["ownedProducts"])
        for owned_product in products:
            row[f"own_{owned_product}"] = 1.0 if owned_product in owned else 0.0
        rows.append(row)
    return pd.DataFrame(rows)


def main() -> None:
    meta = json.loads(MODEL_META.read_text(encoding="utf-8"))
    profiles = json.loads(PROFILES.read_text(encoding="utf-8"))
    model = CatBoostClassifier()
    model.load_model(str(CBM))
    products: list[str] = meta["products"]

    fixtures = []
    for profile in profiles:
        frame = build_frame(profile, products)[meta["feature_names"]]
        pool = Pool(frame, cat_features=meta["categorical_features"])
        probs = model.predict_proba(pool)[:, 1].tolist()
        ranked = sorted(zip(products, probs), key=lambda item: item[1], reverse=True)
        fixtures.append(
            {
                "profileId": profile["id"],
                "scores": {product: round(float(score), 10) for product, score in zip(products, probs)},
                "top5": [product for product, _ in ranked[:5]],
            }
        )

    OUT.write_text(json.dumps(fixtures, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
