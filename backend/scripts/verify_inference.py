#!/usr/bin/env python3
"""End-to-end smoke test: CatBoost pkl + mobile JSON surrogate logic."""

from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
ROOT = BACKEND.parent
sys.path.insert(0, str(BACKEND))

from src.models.catboost_pointwise import UserContext, get_recommender  # noqa: E402

MOBILE_JSON = ROOT / "frontend" / "public" / "model" / "catboost_mobile.json"
PKL = BACKEND / "models" / "export" / "catboost_pointwise_holdout.pkl"


def test_pkl() -> None:
    assert PKL.exists(), f"missing {PKL}"
    rec = get_recommender()
    ctx = UserContext.from_api(age=30, balance=250_000, monthly_income=85_000)
    ranked = rec.rank_products(ctx, top_k=5)
    assert len(ranked) >= 1, "empty ranking"
    assert all(0 <= s <= 1 for _, s in ranked), "scores out of range"
    print("pkl:", [p for p, _ in ranked[:3]])


def test_mobile_json() -> None:
    assert MOBILE_JSON.exists(), f"missing {MOBILE_JSON}"
    data = json.loads(MOBILE_JSON.read_text(encoding="utf-8"))
    sur = data["surrogate"]
    assert sur["coef"], "empty coef"
    assert sur["products"], "empty products"
    print("mobile json: ok,", len(sur["products"]), "products")


def main() -> None:
    test_pkl()
    test_mobile_json()
    print("ALL OK")


if __name__ == "__main__":
    main()
