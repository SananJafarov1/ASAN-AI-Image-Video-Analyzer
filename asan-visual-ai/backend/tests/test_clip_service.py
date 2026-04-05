"""Tests for CLIP similarity rescaling and cosine similarity."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
from services.clip_service import cosine_similarity, _rescale


class TestCosineSmilarity:
    def test_identical_vectors(self):
        v = np.array([1.0, 0.0, 0.0])
        assert abs(cosine_similarity(v, v) - 1.0) < 1e-6

    def test_orthogonal_vectors(self):
        a = np.array([1.0, 0.0])
        b = np.array([0.0, 1.0])
        assert abs(cosine_similarity(a, b)) < 1e-6

    def test_opposite_vectors(self):
        a = np.array([1.0, 0.0])
        b = np.array([-1.0, 0.0])
        assert abs(cosine_similarity(a, b) - (-1.0)) < 1e-6

    def test_similar_vectors(self):
        a = np.array([1.0, 1.0])
        b = np.array([1.0, 0.9])
        score = cosine_similarity(a, b)
        assert 0.99 < score < 1.0


class TestRescale:
    def test_floor_maps_to_zero(self):
        assert _rescale(0.3) == 0.0

    def test_ceiling_maps_to_one(self):
        assert _rescale(1.0) == 1.0

    def test_midpoint(self):
        result = _rescale(0.65, floor=0.3, ceiling=1.0)
        assert abs(result - 0.5) < 0.01

    def test_below_floor_clamped_to_zero(self):
        assert _rescale(0.1) == 0.0

    def test_above_ceiling_clamped_to_one(self):
        assert _rescale(1.5) == 1.0

    def test_unrelated_images_score_low(self):
        """Raw CLIP ~0.45 for unrelated images should rescale to ~21%."""
        result = _rescale(0.45)
        assert result < 0.25

    def test_same_image_score_high(self):
        """Raw CLIP ~0.99 for identical images should rescale to ~99%."""
        result = _rescale(0.99)
        assert result > 0.95
