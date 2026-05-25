"""
BitNet b1.58 operators and recommender head.

Quantization follows Microsoft training FAQ (The Era of 1-bit LLMs):
https://github.com/microsoft/unilm/blob/master/bitnet/The-Era-of-1-bit-LLMs__Training_Tips_Code_FAQ.pdf

Inference on device (GGUF / ARM) uses official bitnet.cpp:
https://github.com/microsoft/BitNet
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
import torch.nn.functional as F

# Official BitNet b1.58 training quantizers (Microsoft FAQ)
BITNET_FAQ_REF = (
    "https://github.com/microsoft/unilm/blob/master/bitnet/"
    "The-Era-of-1-bit-LLMs__Training_Tips_Code_FAQ.pdf"
)


def activation_quant(x: torch.Tensor) -> torch.Tensor:
    """8-bit absmax activation quant (W1.58A8)."""
    scale = 127.0 / x.abs().max(dim=-1, keepdim=True).values.clamp(min=1e-5)
    return (x * scale).round().clamp(-128, 127) / scale


def activation_quant_ste(x: torch.Tensor) -> torch.Tensor:
    q = activation_quant(x)
    return q.detach() + x - x.detach()


def weight_quant(w: torch.Tensor) -> torch.Tensor:
    """Ternary {-1, 0, +1} absmean weight quant (1.58-bit), STE backward."""
    scale = 1.0 / w.abs().mean().clamp(min=1e-5)
    u = (w * scale).round().clamp(-1, 1) / scale
    return u


def weight_quant_ste(w: torch.Tensor) -> torch.Tensor:
    q = weight_quant(w)
    return q.detach() + w - w.detach()


# Backward-compatible aliases
weight_quant_b158 = weight_quant_ste
activation_quant_int8 = activation_quant_ste


class RMSNorm(nn.Module):
    """RMSNorm; gamma stored as `w` for frontend JSON compatibility."""

    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.w = nn.Parameter(torch.ones(dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        rms = x.pow(2).mean(-1, keepdim=True).add(self.eps).sqrt()
        return x / rms * self.w


class BitLinear158(nn.Module):
    """BitLinear: RMSNorm → 8-bit activations → ternary weights (Microsoft b1.58)."""

    def __init__(self, in_features: int, out_features: int, bias: bool = True):
        super().__init__()
        self.norm = RMSNorm(in_features)
        self.weight = nn.Parameter(torch.zeros(out_features, in_features))
        nn.init.trunc_normal_(self.weight, std=0.02)
        if bias:
            self.bias = nn.Parameter(torch.zeros(out_features))
        else:
            self.register_parameter("bias", None)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_norm = self.norm(x)
        x_q = activation_quant_ste(x_norm)
        w_q = weight_quant_ste(self.weight)
        return F.linear(x_q, w_q, self.bias)


class BitNetMLP(nn.Module):
    """SwiGLU MLP with BitLinear layers."""

    def __init__(self, dim: int, hidden_mult: int = 4):
        super().__init__()
        h = int(dim * hidden_mult * 2 / 3)
        self.gate = BitLinear158(dim, h)
        self.up = BitLinear158(dim, h)
        self.down = BitLinear158(h, dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.down(F.silu(self.gate(x)) * self.up(x))


class BitNetBlock(nn.Module):
    def __init__(self, dim: int, dropout: float = 0.1):
        super().__init__()
        self.attn_norm = RMSNorm(dim)
        self.attn = BitLinear158(dim, dim)
        self.mlp_norm = RMSNorm(dim)
        self.mlp = BitNetMLP(dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.dropout(self.attn(self.attn_norm(x)))
        x = x + self.dropout(self.mlp(self.mlp_norm(x)))
        return x


class BitNetRecommender(nn.Module):
    """Full BitNet-style stack (blocks + SwiGLU) for larger checkpoints / GGUF."""

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
        self.blocks = nn.ModuleList(
            [BitNetBlock(hidden_dim, dropout) for _ in range(num_layers)]
        )
        self.norm_out = RMSNorm(hidden_dim)
        self.head = nn.Linear(hidden_dim, num_products)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.embed(x)
        for block in self.blocks:
            x = block(x)
        return self.head(self.norm_out(x))

    def export_info(self) -> dict:
        params = sum(p.numel() for p in self.parameters())
        weight_params = sum(
            p.numel() for n, p in self.named_parameters() if "weight" in n
        )
        bit_factor = 1.58
        norm_params = params - weight_params
        total_kb = (weight_params * bit_factor / 8 + norm_params * 2) / 1024
        hidden = self.blocks[0].attn.weight.shape[0] if self.blocks else 0
        return {
            "architecture": "BitNet-b1.58-MLP",
            "paper": "The Era of 1-bit LLMs (Ma et al., 2024)",
            "bitnet_cpp": "https://github.com/microsoft/BitNet",
            "quantization_faq": BITNET_FAQ_REF,
            "total_parameters": params,
            "weight_bits": 1.58,
            "activation_bits": 8,
            "model_size_kb": round(total_kb, 1),
            "input_dim": self.embed.in_features,
            "num_products": self.head.out_features,
            "hidden_dim": hidden,
            "num_layers": len(self.blocks),
        }


class SimpleBitNet(nn.Module):
    """Canonical recommender: BitLinear blocks + residual (matches frontend inference)."""

    def __init__(
        self,
        d_in: int = 32,
        d_out: int = 36,
        d_h: int = 128,
        n_layers: int = 3,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.embed = nn.Linear(d_in, d_h, bias=False)
        self.blocks = nn.ModuleList(
            [
                nn.Sequential(BitLinear158(d_h, d_h), nn.Dropout(dropout))
                for _ in range(n_layers)
            ]
        )
        self.norm = RMSNorm(d_h)
        self.head = nn.Linear(d_h, d_out)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.embed(x)
        for block in self.blocks:
            x = F.silu(block[0](x)) + x
        return self.head(self.norm(x))

    def export_info(self) -> dict:
        params = sum(p.numel() for p in self.parameters())
        weight_params = sum(
            p.numel()
            for n, p in self.named_parameters()
            if "weight" in n and p.dim() >= 2
        )
        bit_factor = 1.58
        norm_params = params - weight_params
        total_kb = (weight_params * bit_factor / 8 + norm_params * 2) / 1024
        return {
            "architecture": "SimpleBitNet-b1.58",
            "bitnet_cpp": "https://github.com/microsoft/BitNet",
            "quantization_faq": BITNET_FAQ_REF,
            "total_parameters": params,
            "weight_bits": 1.58,
            "activation_bits": 8,
            "model_size_kb": round(total_kb, 1),
            "input_dim": self.embed.in_features,
            "num_products": self.head.out_features,
            "hidden_dim": self.embed.out_features,
            "num_layers": len(self.blocks),
        }


def to_frontend_param_name(pytorch_name: str) -> str:
    """Map norm.weight → norm.w if any legacy checkpoints use .weight."""
    if pytorch_name.endswith("norm.weight"):
        return pytorch_name.replace("norm.weight", "norm.w")
    if ".norm.weight" in pytorch_name:
        return pytorch_name.replace(".norm.weight", ".norm.w")
    return pytorch_name


def from_frontend_param_name(frontend_name: str) -> str:
    if frontend_name.endswith("norm.w"):
        return frontend_name.replace("norm.w", "norm.weight")
    if ".norm.w" in frontend_name:
        return frontend_name.replace(".norm.w", ".norm.weight")
    return frontend_name


def export_frontend_weights(
    model: SimpleBitNet,
    output_dir: Path,
    feature_names: list | None = None,
    product_names: list | None = None,
    norm_mean: list | None = None,
    norm_std: list | None = None,
) -> dict:
    """Export quantized weights for browser inference (W1.58A8)."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    model.eval()
    weights: dict = {}
    with torch.no_grad():
        for name, param in model.named_parameters():
            key = to_frontend_param_name(name)
            if "weight" in name and param.dim() >= 2 and "norm" not in name:
                w_q = weight_quant(param)
                g = float(param.abs().mean().clamp(min=1e-5))
                w = torch.clamp(torch.round(param * (1.0 / g)), -1, 1).cpu().numpy()
                weights[key] = {
                    "data": w.tolist(),
                    "gamma": g,
                    "shape": list(w.shape),
                }
            else:
                weights[key] = {
                    "data": param.detach().cpu().numpy().tolist(),
                    "shape": list(param.detach().shape),
                }

    with open(output_dir / "bitnet_weights.json", "w", encoding="utf-8") as f:
        json.dump(weights, f)

    if product_names is None:
        product_names = [f"prod_{i}" for i in range(model.head.out_features)]
    if feature_names is None:
        feature_names = [f"feat_{i}" for i in range(model.embed.in_features)]

    order = {"input_features": feature_names, "product_names": product_names}
    with open(output_dir / "feature_order.json", "w", encoding="utf-8") as f:
        json.dump(order, f, indent=2, ensure_ascii=False)

    norm = {
        "mean": norm_mean if norm_mean is not None else [35, 50000, 60000, 0, 0],
        "std": norm_std if norm_std is not None else [15, 30000, 40000, 3, 3],
    }
    with open(output_dir / "normalization.json", "w", encoding="utf-8") as f:
        json.dump(norm, f)

    print(f"  Weights → {output_dir / 'bitnet_weights.json'}")
    print(f"  Feature order → {output_dir / 'feature_order.json'}")
    return weights


def load_frontend_weights(model: SimpleBitNet, weights: dict) -> None:
    """Load JSON weights exported for the frontend."""
    for name, param in model.named_parameters():
        key = to_frontend_param_name(name)
        if key not in weights:
            continue
        entry = weights[key]
        import numpy as np

        arr = np.array(entry["data"], dtype=np.float32)
        if name.endswith("weight") and arr.ndim == 2 and "gamma" in entry:
            arr = arr * entry["gamma"]
        t = torch.from_numpy(arr)
        if t.shape == param.shape:
            param.data.copy_(t)


if __name__ == "__main__":
    model = BitNetRecommender(input_dim=32, num_products=36, hidden_dim=256, num_layers=4)
    x = torch.randn(4, 32)
    y = model(x)
    info = model.export_info()
    print("BitNet b1.58 Recommender")
    print(f"  Input:  {x.shape} → Output: {y.shape}")
    print(f"  Params: {info['total_parameters']:,}")
    print(f"  Size:   {info['model_size_kb']} KB")
    for name, param in model.named_parameters():
        if "weight" in name and param.dim() == 2:
            w_q = weight_quant(param)
            unique = sorted(w_q.unique().tolist())
            print(f"  {name}: quant values {unique}")
