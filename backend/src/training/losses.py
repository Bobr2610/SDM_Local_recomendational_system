"""Losses for multi-label product ranking (Focal + listwise top-K)."""

import torch
import torch.nn.functional as F


def sigmoid_focal_loss(
    logits: torch.Tensor,
    targets: torch.Tensor,
    alpha: float = 0.25,
    gamma: float = 2.0,
) -> torch.Tensor:
    """Focal loss for imbalanced multi-label (RetinaNet-style)."""
    p = torch.sigmoid(logits)
    ce = F.binary_cross_entropy_with_logits(logits, targets, reduction="none")
    p_t = p * targets + (1 - p) * (1 - targets)
    loss = ce * ((1 - p_t) ** gamma)
    if alpha >= 0:
        alpha_t = alpha * targets + (1 - alpha) * (1 - targets)
        loss = alpha_t * loss
    return loss.mean()


def topk_pairwise_ranking_loss(
    logits: torch.Tensor,
    targets: torch.Tensor,
    k: int = 5,
    margin: float = 1.0,
) -> torch.Tensor:
    """
    Vectorized listwise hinge в top-K: релевантные выше нерелевантных.
    """
    k = min(k, logits.size(1))
    topk_scores, topk_idx = logits.topk(k, dim=1)
    topk_targets = targets.gather(1, topk_idx)

    s_diff = topk_scores.unsqueeze(2) - topk_scores.unsqueeze(1)
    t_diff = topk_targets.unsqueeze(2) - topk_targets.unsqueeze(1)

    mask = (t_diff > 0.5).float()
    eye = torch.eye(k, device=logits.device, dtype=torch.bool)
    mask = mask.masked_fill(eye.unsqueeze(0), 0.0)

    hinge = F.relu(margin - s_diff) * mask
    denom = mask.sum().clamp(min=1.0)
    return hinge.sum() / denom


def combined_recommendation_loss(
    logits: torch.Tensor,
    targets: torch.Tensor,
    *,
    focal_weight: float = 1.0,
    rank_weight: float = 0.5,
    rank_k: int = 5,
) -> torch.Tensor:
    focal = sigmoid_focal_loss(logits, targets)
    rank = topk_pairwise_ranking_loss(logits, targets, k=rank_k)
    return focal_weight * focal + rank_weight * rank
