"""
Конфигурация обучения BitNet-модели.

Меняй параметры здесь — они подхватятся train.py.
"""

BITNET_CONFIG = {
    # Архитектура
    "input_dim": 32,
    "num_products": 36,
    "hidden_dim": 256,
    "num_layers": 3,
    "dropout": 0.1,
    "activation_bits": 8,

    # Обучение
    "epochs": 20,
    "batch_size": 256,
    "learning_rate": 1e-3,
    "weight_decay": 1e-4,

    # Данные
    "sample_frac": 0.1,          # Доля датасета для обучения (1.0 = полный)
    "val_split": 0.2,
    "random_seed": 42,
    "synthetic_samples": 10000,  # Если датасет не найден

    # Экспорт
    "onnx_opset": 17,
    "target_frameworks": ["ONNX", "TFLite"],
}
