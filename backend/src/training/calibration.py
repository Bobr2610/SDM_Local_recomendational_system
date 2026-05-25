"""Post-hoc temperature scaling for multi-label logits."""

import numpy as np
import torch
import torch.nn.functional as F


def fit_temperature(
    logits: torch.Tensor,
    targets: torch.Tensor,
    t_min: float = 0.35,
    t_max: float = 1.25,
    steps: int = 19,
) -> float:
    """
    Подбор T на validation: logits / T, минимизация BCE.
    T < 1 → более «острые» вероятности после sigmoid.
    """
    best_t = 1.0
    best_nll = float("inf")
    logits = logits.detach()
    targets = targets.detach()

    for t in np.linspace(t_min, t_max, steps):
        t_tensor = float(t)
        if t_tensor <= 0:
            continue
        nll = F.binary_cross_entropy_with_logits(logits / t_tensor, targets).item()
        if nll < best_nll:
            best_nll = nll
            best_t = t_tensor

    return best_t
