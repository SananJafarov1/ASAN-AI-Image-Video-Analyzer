"""Tests for the verification resolution logic (from institution.py)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def resolve_logic(similarity_score, same_location, images_unchanged,
                  original_top, result_top):
    """Mirrors the resolution logic from institution.py verify endpoint."""
    damage_still_present = (
        original_top is not None
        and result_top is not None
        and original_top == result_top
    )

    if images_unchanged:
        resolved = False
    else:
        resolved = same_location and not damage_still_present

    reasons = []
    if not resolved:
        if images_unchanged:
            reasons.append("images_unchanged")
        if not same_location and not images_unchanged:
            reasons.append("different_location")
        if damage_still_present:
            reasons.append("damage_still_present")

    return resolved, reasons


class TestVerificationLogic:
    def test_same_image_not_resolved(self):
        """Uploading the exact same photo should NOT resolve the issue."""
        resolved, reasons = resolve_logic(
            similarity_score=1.0,
            same_location=True,
            images_unchanged=True,
            original_top=None,
            result_top=None,
        )
        assert resolved is False
        assert "images_unchanged" in reasons

    def test_nearly_identical_image_not_resolved(self):
        """96% similarity = nothing changed."""
        resolved, reasons = resolve_logic(
            similarity_score=0.96,
            same_location=True,
            images_unchanged=True,
            original_top="pothole",
            result_top="pothole",
        )
        assert resolved is False
        assert "images_unchanged" in reasons

    def test_different_location_not_resolved(self):
        """Low similarity = different location."""
        resolved, reasons = resolve_logic(
            similarity_score=0.4,
            same_location=False,
            images_unchanged=False,
            original_top="pothole",
            result_top=None,
        )
        assert resolved is False
        assert "different_location" in reasons

    def test_same_damage_still_present_not_resolved(self):
        """Same damage class detected in both = not fixed."""
        resolved, reasons = resolve_logic(
            similarity_score=0.82,
            same_location=True,
            images_unchanged=False,
            original_top="pothole",
            result_top="pothole",
        )
        assert resolved is False
        assert "damage_still_present" in reasons

    def test_same_location_damage_gone_resolved(self):
        """Same location + damage no longer detected = resolved."""
        resolved, reasons = resolve_logic(
            similarity_score=0.82,
            same_location=True,
            images_unchanged=False,
            original_top="pothole",
            result_top=None,
        )
        assert resolved is True
        assert reasons == []

    def test_same_location_different_damage_resolved(self):
        """Same location + different damage class = original issue resolved."""
        resolved, reasons = resolve_logic(
            similarity_score=0.80,
            same_location=True,
            images_unchanged=False,
            original_top="pothole",
            result_top="trash",
        )
        assert resolved is True

    def test_no_damage_in_either_same_location_resolved(self):
        """No damage detected in original or result, same location, not identical = resolved."""
        resolved, reasons = resolve_logic(
            similarity_score=0.85,
            same_location=True,
            images_unchanged=False,
            original_top=None,
            result_top=None,
        )
        assert resolved is True
