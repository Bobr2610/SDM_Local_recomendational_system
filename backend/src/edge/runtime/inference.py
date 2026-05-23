"""
Edge-рантайм для Android: инференс BitNet-модели на устройстве.

Архитектура (Android/Kotlin):
    app/src/main/java/com/sdm/edge/
    ├── BitNetInference.kt       # ONNX Runtime обёртка
    ├── FeatureExtractor.kt      # Извлечение фичей из Clickstream + профиля
    ├── PersonalizationEngine.kt # Online-адаптация под пользователя
    └── RecommendationService.kt # Сервис рекомендаций

Поток данных:
    1. FeatureExtractor собирает фичи: age, balance, income, button_clicks[24]
    2. BitNetInference прогоняет через ONNX → product_scores [36]
    3. PersonalizationEngine корректирует скоры по истории пользователя
    4. RecommendationService выбирает top-k продуктов

Для портирования:
    1. Поместить bitnet_recommender.onnx в app/src/main/assets/
    2. Подключить onnxruntime-android в build.gradle
    3. Имплементировать классы ниже
"""

# ─── Android-интерфейс (Kotlin-спецификация) ───

ANDROID_INTERFACE = """
// === build.gradle (app) ===
dependencies {
    implementation 'com.microsoft.onnxruntime:onnxruntime-android:1.16.0'
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.6.0'
}

// === BitNetInference.kt ===
class BitNetInference(context: Context) {
    private val env: OrtEnvironment = OrtEnvironment.getEnvironment()
    private val session: OrtSession

    init {
        val modelBytes = context.assets.open("bitnet_recommender.onnx").readBytes()
        session = env.createSession(modelBytes)
    }

    fun predict(features: FloatArray): FloatArray {
        val input = OnnxTensor.createTensor(env, arrayOf(features), longArrayOf(1, features.size.toLong()))
        val output = session.run(mapOf("user_features" to input))
        return (output["product_scores"]?.floatBuffer ?: FloatArray(36)).toArray()
    }
}

// === FeatureExtractor.kt ===
class FeatureExtractor {
    fun extract(profile: UserProfile, clickHistory: Map<String, Int>): FloatArray {
        val feats = FloatArray(32)
        feats[0] = (profile.age - 35f) / 15f           // нормализация
        feats[1] = (profile.balance - 50000f) / 30000f
        feats[2] = (profile.monthlyIncome - 60000f) / 40000f
        feats[3] = profile.accountType.ordinal.toFloat() / 3f
        feats[4] = profile.currency.ordinal.toFloat() / 3f
        // click features [5..29] = нормализованные счётчики нажатий
        for ((productId, count) in clickHistory) {
            val idx = 5 + (productId.hashCode() % 24)
            feats[idx] = count.toFloat() / 100f
        }
        return feats
    }
}

// === PersonalizationEngine.kt ===
class PersonalizationEngine {
    private val userProductScores = mutableMapOf<String, FloatArray>()

    fun personalize(userId: String, rawScores: FloatArray,
                    clickHistory: Map<String, Int>): FloatArray {
        val adjusted = rawScores.copyOf()
        for ((productId, count) in clickHistory) {
            val idx = productId.hashCode() % 36
            adjusted[idx] += 0.05f * count  // boost за интерес
        }
        // Сохраняем для офлайн-адаптации
        userProductScores[userId] = adjusted
        return adjusted
    }
}
"""

# ─── Python-эмулятор edge-рантайма для тестов ───

from pathlib import Path
from typing import Dict, Optional

import numpy as np

from src.edge.personalization.online_bias import OnlineBiasPersonalizer
from src.edge.personalization.storage import load_json, save_json


class EdgeRuntime:
    """Python-эмулятор Android-рантайма. Используется для тестирования."""

    def __init__(
        self,
        onnx_path: Optional[Path] = None,
        storage_dir: Optional[Path] = None,
        num_products: int = 36,
    ):
        self.num_products = num_products
        self.user_states: Dict[str, dict] = {}
        self.storage_dir = storage_dir or (Path(__file__).parent / "_edge_state")
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        self.session = None
        try:
            import onnxruntime as ort
            path = onnx_path or Path(__file__).parent.parent.parent.parent / "models" / "export" / "bitnet_recommender.onnx"
            if path.exists():
                self.session = ort.InferenceSession(str(path))
        except ImportError:
            pass

    def _user_dir(self, user_id: str) -> Path:
        return self.storage_dir / "users" / user_id

    def _load_user_state(self, user_id: str) -> dict:
        if user_id in self.user_states:
            return self.user_states[user_id]

        udir = self._user_dir(user_id)
        udir.mkdir(parents=True, exist_ok=True)

        click_history = load_json(udir / "click_history.json", default={})
        personalization = load_json(udir / "personalization.json", default=None)
        if personalization is None:
            personalizer = OnlineBiasPersonalizer(num_products=self.num_products)
        else:
            personalizer = OnlineBiasPersonalizer.from_state(personalization)

        state = {
            "click_history": click_history,
            "personalizer": personalizer,
        }
        self.user_states[user_id] = state
        return state

    def _save_user_state(self, user_id: str) -> None:
        state = self.user_states.get(user_id)
        if not state:
            return
        udir = self._user_dir(user_id)
        save_json(udir / "click_history.json", state["click_history"])
        save_json(udir / "personalization.json", state["personalizer"].to_state())

    def extract_features(
        self,
        age: float,
        balance: float,
        monthly_income: float,
        account_type: int,
        currency: int,
        click_history: Optional[Dict[str, int]] = None,
    ) -> np.ndarray:
        """FeatureExtractor — те же нормализации, что на Android."""
        feats = np.zeros(32, dtype=np.float32)
        feats[0] = (age - 35) / 15
        feats[1] = (balance - 50000) / 30000
        feats[2] = (monthly_income - 60000) / 40000
        feats[3] = account_type / 3
        feats[4] = currency / 3
        if click_history:
            for product_id, count in click_history.items():
                idx = 5 + (hash(product_id) % 24)
                feats[idx] = min(count / 100, 1.0)
        return feats

    def predict(self, features: np.ndarray) -> np.ndarray:
        """Инференс через ONNX или fallback-эвристику."""
        if self.session is not None:
            scores = self.session.run(
                ["product_scores"],
                {"user_features": features.reshape(1, -1)},
            )[0][0]
        else:
            # Fallback: эвристика по возрасту и доходу
            rng = np.random.RandomState(hash(str(features.tobytes())) % 2**31)
            scores = np.zeros(36, dtype=np.float32)
            age_factor = (features[0] + 1) / 2
            balance_factor = (features[1] + 3) / 6
            for i in range(36):
                base = 0.1 + 0.05 * np.sin(i * 0.5)
                scores[i] = base + 0.3 * age_factor + 0.3 * balance_factor + rng.normal(0, 0.1)
            scores = np.clip(scores, 0, 1)
        return scores

    def personalize(self, user_id: str, scores: np.ndarray) -> np.ndarray:
        """Персонализация: локальное дообучение bias-вектора на кликах пользователя."""
        state = self._load_user_state(user_id)
        personalizer: OnlineBiasPersonalizer = state["personalizer"]
        adjusted = personalizer.apply(scores)
        self._save_user_state(user_id)
        return adjusted

    def track_click(self, user_id: str, product_id: str, scores: Optional[np.ndarray] = None):
        """Регистрация нажатия и онлайн-обновление локальной персонализации."""
        state = self._load_user_state(user_id)
        click_history: Dict[str, int] = state["click_history"]
        click_history[product_id] = click_history.get(product_id, 0) + 1

        if scores is not None:
            clicked_idx = hash(product_id) % self.num_products
            state["personalizer"].update(clicked_idx, scores)

        self._save_user_state(user_id)

    def get_top_k(self, scores: np.ndarray, k: int = 3) -> list[int]:
        """Топ-k продуктов."""
        return np.argsort(-scores)[:k].tolist()
