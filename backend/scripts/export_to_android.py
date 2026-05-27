"""Export model for Android: syncs frontend bundle + backend/edge/android_assets."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from export_model import export_model  # noqa: E402

if __name__ == "__main__":
    export_model()
