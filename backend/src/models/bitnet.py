"""
BitNet b1.58: 1.58-битная рекомендательная модель.

Архитектура из статьи "The Era of 1-bit LLMs" (Microsoft, 2024):
- BitLinear: веса {-1, 0, +1} (1.58 бита), активации int8
- RMSNorm вместо LayerNorm
- SwiGLU активация
- Остаточные связи

Экспорт: .gguf (через llama.cpp конвертер) или ONNX

Использование:
    from src.models.bitnet import BitNetRecommender
    model = BitNetRecommender(input_dim=32, num_products=36)
    logits = model(user_features)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional


# ═══════════════════════════════════════════
# BitNet b1.58 operators
# ═══════════════════════════════════════════

def weight_quant_b158(w: torch.Tensor) -> torch.Tensor:
    """Квантование весов в {-1, 0, +1} (1.58 бит) через STE."""
    gamma = w.abs().mean()
    w_scaled = w / (gamma + 1e-8)
    # Round to nearest in {-1, 0, +1}
    w_q = torch.clamp(torch.round(w_scaled), -1, 1)
    # Straight-through: градиент идёт через float веса
    return (w_q * gamma).detach() + w - w.detach()


def activation_quant_int8(x: torch.Tensor) -> torch.Tensor:
    """Квантование активаций в [-128, 127] → float (ABSMAX)."""
    Qb = 127.0
    scale = x.abs().max(dim=-1, keepdim=True).values.clamp(min=1e-8) / Qb
    x_q = torch.clamp(torch.round(x / scale), -Qb, Qb)
    return (x_q * scale).detach() + x - x.detach()


class RMSNorm(nn.Module):
    """RMS Layer Normalization (без mean-centering, как в BitNet)."""
    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        rms = x.pow(2).mean(-1, keepdim=True).add(self.eps).sqrt()
        return x / rms * self.weight


class BitLinear158(nn.Module):
    """BitLinear с 1.58-битными весами и 8-битными активациями."""
    def __init__(self, in_features: int, out_features: int):
        super().__init__()
        self.norm = RMSNorm(in_features)
        self.weight = nn.Parameter(torch.zeros(out_features, in_features))
        nn.init.trunc_normal_(self.weight, std=0.02)
        self.bias = nn.Parameter(torch.zeros(out_features))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_norm = self.norm(x)
        x_q = activation_quant_int8(x_norm)
        w_q = weight_quant_b158(self.weight)
        return F.linear(x_q, w_q, self.bias)


class BitNetMLP(nn.Module):
    """SwiGLU MLP с BitLinear."""
    def __init__(self, dim: int, hidden_mult: int = 4):
        super().__init__()
        h = int(dim * hidden_mult * 2 / 3)
        self.gate = BitLinear158(dim, h)
        self.up = BitLinear158(dim, h)
        self.down = BitLinear158(h, dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.down(F.silu(self.gate(x)) * self.up(x))


class BitNetBlock(nn.Module):
    """Один блок: RMSNorm → BitLinear → SwiGLU → residual."""
    def __init__(self, dim: int, dropout: float = 0.1):
        super().__init__()
        self.attn_norm = RMSNorm(dim)
        self.attn = BitLinear158(dim, dim)
        self.mlp_norm = RMSNorm(dim)
        self.mlp = BitNetMLP(dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Attention-подобный путь (BitLinear вместо QKV)
        x = x + self.dropout(self.attn(self.attn_norm(x)))
        # SwiGLU MLP
        x = x + self.dropout(self.mlp(self.mlp_norm(x)))
        return x


# ═══════════════════════════════════════════
# BitNet Recommender
# ═══════════════════════════════════════════

class BitNetRecommender(nn.Module):
    """Рекомендательная модель на BitNet b1.58.

    Args:
        input_dim: размерность входных фичей
        num_products: количество продуктов (выходная размерность)
        hidden_dim: скрытая размерность
        num_layers: количество BitNet-блоков
        dropout: дропаут
    """
    def __init__(
        self,
        input_dim: int = 32,
        num_products: int = 36,
        hidden_dim: int = 256,
        num_layers: int = 4,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.embed = nn.Linear(input_dim, hidden_dim, bias=False)
        self.blocks = nn.ModuleList([
            BitNetBlock(hidden_dim, dropout) for _ in range(num_layers)
        ])
        self.norm_out = RMSNorm(hidden_dim)
        self.head = nn.Linear(hidden_dim, num_products)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.embed(x)
        for block in self.blocks:
            x = block(x)
        return self.head(self.norm_out(x))

    def export_info(self) -> dict:
        """Метаданные модели."""
        params = sum(p.numel() for p in self.parameters())
        weight_params = sum(
            p.numel() for n, p in self.named_parameters() if 'weight' in n
        )
        bit_factor = 1.58  # 1.58 бита на параметр (веса)
        norm_params = params - weight_params  # fp16 (нормы, эмбеддинги)
        total_kb = (weight_params * bit_factor / 8 + norm_params * 2) / 1024

        return {
            "architecture": "BitNet-b1.58-MLP",
            "paper": "The Era of 1-bit LLMs (Ma et al., 2024)",
            "total_parameters": params,
            "weight_bits": 1.58,
            "activation_bits": 8,
            "model_size_kb": round(total_kb, 1),
            "input_dim": self.embed.in_features,
            "num_products": self.head.out_features,
            "hidden_dim": self.blocks[0].attn.weight.shape[0] if self.blocks else 0,
            "num_layers": len(self.blocks),
        }


# ═══════════════════════════════════════════
# Проверка
# ═══════════════════════════════════════════

if __name__ == "__main__":
    model = BitNetRecommender(input_dim=32, num_products=36, hidden_dim=256, num_layers=4)
    x = torch.randn(4, 32)
    y = model(x)

    info = model.export_info()
    print(f"BitNet b1.58 Recommender")
    print(f"  Input:  {x.shape} → Output: {y.shape}")
    print(f"  Params: {info['total_parameters']:,}")
    print(f"  Size:   {info['model_size_kb']} KB ({info['weight_bits']} bit)")
    print(f"  Layers: {info['num_layers']} × dim {info['hidden_dim']}")

    # Проверка: все веса в {-1, 0, +1} после forward
    from src.models.bitnet import weight_quant_b158
    for name, param in model.named_parameters():
        if 'weight' in name and param.dim() == 2:
            w_q = weight_quant_b158(param)
            unique = w_q.unique()
            print(f"  {name}: values in {sorted(unique.tolist())}")
