"""CLIP-based image similarity service for before/after verification."""
from __future__ import annotations

import io
from typing import Any

import numpy as np
from PIL import Image

from config import get_settings

settings = get_settings()

_clip_model = None
_clip_preprocess = None
_clip_tokenizer = None


def _load_clip():
    global _clip_model, _clip_preprocess, _clip_tokenizer
    if _clip_model is not None:
        return

    try:
        import open_clip  # type: ignore

        model_name = "ViT-B-32"
        pretrained = "openai"
        model, _, preprocess = open_clip.create_model_and_transforms(
            model_name, pretrained=pretrained
        )
        model.eval()
        _clip_model = model
        _clip_preprocess = preprocess
    except ImportError:
        # Fallback: use HuggingFace transformers CLIP
        from transformers import CLIPModel, CLIPProcessor  # type: ignore
        import torch

        hf_model_id = settings.clip_model
        _clip_model = CLIPModel.from_pretrained(hf_model_id)
        _clip_preprocess = CLIPProcessor.from_pretrained(hf_model_id)
        _clip_tokenizer = "hf"


def _embed_open_clip(image_bytes: bytes) -> np.ndarray:
    import torch

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = _clip_preprocess(image).unsqueeze(0)
    with torch.no_grad():
        features = _clip_model.encode_image(tensor)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.cpu().numpy().flatten()


def _embed_hf(image_bytes: bytes) -> np.ndarray:
    import torch

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = _clip_preprocess(images=image, return_tensors="pt")
    with torch.no_grad():
        features = _clip_model.get_image_features(**inputs)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.cpu().numpy().flatten()


def embed_image(image_bytes: bytes) -> np.ndarray:
    _load_clip()
    if _clip_tokenizer == "hf":
        return _embed_hf(image_bytes)
    return _embed_open_clip(image_bytes)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))


def _rescale(raw: float, floor: float = 0.3, ceiling: float = 1.0) -> float:
    """
    Rescale raw CLIP cosine similarity to a human-intuitive 0–1 range.
    CLIP rarely scores below ~0.3 even for completely unrelated images,
    so we treat 0.3 as 0% and 1.0 as 100%.
    """
    scaled = (raw - floor) / (ceiling - floor)
    return max(0.0, min(1.0, scaled))


def compare(before_bytes: bytes, after_bytes: bytes) -> dict[str, Any]:
    """
    Compare citizen (before) image with institution (after) image.
    Returns similarity score and basic verdict.
    """
    emb_before = embed_image(before_bytes)
    emb_after = embed_image(after_bytes)
    raw_score = cosine_similarity(emb_before, emb_after)
    score = _rescale(raw_score)

    threshold = settings.clip_similarity_threshold
    verdict = score >= threshold

    return {
        "similarity_score": round(score, 4),
        "raw_similarity": round(raw_score, 4),
        "threshold": threshold,
        "same_location": verdict,
    }
