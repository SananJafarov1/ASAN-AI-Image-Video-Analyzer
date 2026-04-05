"""Priority scoring: combines YOLO weights with GPT-4 Vision output."""
from __future__ import annotations

from models.request import PriorityEnum


# Priority weight thresholds from YOLO
URGENT_WEIGHT = 3
MEDIUM_WEIGHT = 2


def compute_priority(
    yolo_max_weight: int,
    gpt_priority: str | None,
    has_problem: bool = True,
) -> PriorityEnum:
    """
    Determine final priority, taking the higher of YOLO weight and Gemini suggestion.
    If neither source detects a problem, returns asagi (lowest).
    """
    # If Gemini says no problem and YOLO found no damage classes, return lowest
    if not has_problem and yolo_max_weight == 0:
        return PriorityEnum.asagi

    # Resolve YOLO-based priority (only damage classes have weight > 0)
    if yolo_max_weight >= URGENT_WEIGHT:
        yolo_priority = PriorityEnum.tecili
    elif yolo_max_weight >= MEDIUM_WEIGHT:
        yolo_priority = PriorityEnum.orta
    else:
        yolo_priority = PriorityEnum.asagi

    # Resolve Gemini-based priority ("yoxdur" = no problem → asagi)
    gpt_map = {
        "tecili": PriorityEnum.tecili,
        "orta": PriorityEnum.orta,
        "asagi": PriorityEnum.asagi,
        "yoxdur": PriorityEnum.asagi,
    }
    gpt_p = gpt_map.get(str(gpt_priority).lower(), PriorityEnum.asagi)

    # Take the higher of the two
    order = [PriorityEnum.asagi, PriorityEnum.orta, PriorityEnum.tecili]
    final_idx = max(order.index(yolo_priority), order.index(gpt_p))
    return order[final_idx]


def priority_label_az(priority: PriorityEnum) -> str:
    labels = {
        PriorityEnum.tecili: "Təcili",
        PriorityEnum.orta: "Orta",
        PriorityEnum.asagi: "Aşağı",
    }
    return labels[priority]
