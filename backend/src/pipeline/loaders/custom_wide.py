import json
from pathlib import Path

def export_feature_order(products: list[str], path: Path) -> None:
    data = {
        "input_features": [
            "age",
            "seniority_months",
            "income",
            "is_new_customer",
            "sex_enc",
            "segment_INDIVIDUALS",
            "segment_VIP",
            "segment_STUDENTS"
        ],
        "product_names": products
    }
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
