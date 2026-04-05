"""Tests for priority scoring logic."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.request import PriorityEnum
from services.priority_service import compute_priority, priority_label_az


class TestComputePriority:
    def test_urgent_from_yolo_high_weight(self):
        result = compute_priority(yolo_max_weight=4, gpt_priority="orta")
        assert result == PriorityEnum.tecili

    def test_urgent_from_gpt(self):
        result = compute_priority(yolo_max_weight=1, gpt_priority="tecili")
        assert result == PriorityEnum.tecili

    def test_medium_from_yolo(self):
        result = compute_priority(yolo_max_weight=2, gpt_priority="asagi")
        assert result == PriorityEnum.orta

    def test_medium_from_gpt(self):
        result = compute_priority(yolo_max_weight=0, gpt_priority="orta")
        assert result == PriorityEnum.orta

    def test_low_when_no_damage(self):
        result = compute_priority(yolo_max_weight=0, gpt_priority="asagi")
        assert result == PriorityEnum.asagi

    def test_low_when_no_problem_and_no_yolo(self):
        result = compute_priority(yolo_max_weight=0, gpt_priority=None, has_problem=False)
        assert result == PriorityEnum.asagi

    def test_gpt_yoxdur_treated_as_low(self):
        result = compute_priority(yolo_max_weight=0, gpt_priority="yoxdur")
        assert result == PriorityEnum.asagi

    def test_takes_higher_of_yolo_and_gpt(self):
        result = compute_priority(yolo_max_weight=3, gpt_priority="asagi")
        assert result == PriorityEnum.tecili
        result = compute_priority(yolo_max_weight=1, gpt_priority="tecili")
        assert result == PriorityEnum.tecili

    def test_unknown_gpt_priority_defaults_to_low(self):
        result = compute_priority(yolo_max_weight=0, gpt_priority="unknown_value")
        assert result == PriorityEnum.asagi


class TestPriorityLabelAz:
    def test_tecili_label(self):
        assert priority_label_az(PriorityEnum.tecili) == "Təcili"

    def test_orta_label(self):
        assert priority_label_az(PriorityEnum.orta) == "Orta"

    def test_asagi_label(self):
        assert priority_label_az(PriorityEnum.asagi) == "Aşağı"
