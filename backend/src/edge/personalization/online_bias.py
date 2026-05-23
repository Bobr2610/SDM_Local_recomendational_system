"""Online personalization head for on-device updates.

This is a tiny per-user bias vector that adapts model scores locally.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import numpy as np


@dataclass
class OnlineBiasPersonalizer:
    num_products: int = 36
    lr: float = 0.05
    l2: float = 1e-4
    neg_samples: int = 8
    seed: int = 7

    def __post_init__(self) -> None:
        self.bias = np.zeros(self.num_products, dtype=np.float32)
        self.step = 0
        self._rng = np.random.RandomState(self.seed)

    def apply(self, scores: np.ndarray) -> np.ndarray:
        """Apply local bias to base scores."""
        if scores.shape[0] != self.num_products:
            raise ValueError("scores shape does not match num_products")
        return scores + self.bias

    def update(self, clicked_idx: int, scores: np.ndarray) -> None:
        """Online update using implicit feedback.

        Positive: clicked item should increase. Negatives: sampled items decrease.
        """
        if scores.shape[0] != self.num_products:
            raise ValueError("scores shape does not match num_products")

        logits = scores + self.bias
        pos = clicked_idx % self.num_products

        # Positive update
        p = _sigmoid(logits[pos])
        grad = (1.0 - p)
        self.bias[pos] += self.lr * (grad - self.l2 * self.bias[pos])

        # Negative sampling
        for _ in range(self.neg_samples):
            neg = int(self._rng.randint(0, self.num_products))
            if neg == pos:
                continue
            p_neg = _sigmoid(logits[neg])
            grad_neg = (0.0 - p_neg)
            self.bias[neg] += self.lr * (grad_neg - self.l2 * self.bias[neg])

        self.step += 1

    def to_state(self) -> Dict[str, object]:
        return {
            "num_products": self.num_products,
            "lr": self.lr,
            "l2": self.l2,
            "neg_samples": self.neg_samples,
            "seed": self.seed,
            "step": self.step,
            "bias": self.bias.tolist(),
        }

    @classmethod
    def from_state(cls, state: Dict[str, object]) -> "OnlineBiasPersonalizer":
        obj = cls(
            num_products=int(state.get("num_products", 36)),
            lr=float(state.get("lr", 0.05)),
            l2=float(state.get("l2", 1e-4)),
            neg_samples=int(state.get("neg_samples", 8)),
            seed=int(state.get("seed", 7)),
        )
        bias = state.get("bias")
        if isinstance(bias, list) and len(bias) == obj.num_products:
            obj.bias = np.array(bias, dtype=np.float32)
        obj.step = int(state.get("step", 0))
        return obj


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + np.exp(-x))
