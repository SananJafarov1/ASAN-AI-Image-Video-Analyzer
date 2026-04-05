"""Azerbaijani text formatting helpers."""
from __future__ import annotations

from models.request import CategoryEnum, PriorityEnum


CATEGORY_LABELS: dict[str, str] = {
    CategoryEnum.kommunal: "Kommunal xidmətlər",
    CategoryEnum.yol_neqliyyat: "Yol və nəqliyyat",
    CategoryEnum.infrastruktur: "İnfrastruktur",
    CategoryEnum.ekoloji: "Ekoloji problemlər",
    CategoryEnum.diger: "Digər",
}

PRIORITY_LABELS: dict[str, str] = {
    PriorityEnum.tecili: "Təcili",
    PriorityEnum.orta: "Orta",
    PriorityEnum.asagi: "Aşağı",
}

PRIORITY_COLORS: dict[str, str] = {
    PriorityEnum.tecili: "#ef4444",   # red
    PriorityEnum.orta: "#f59e0b",     # amber
    PriorityEnum.asagi: "#22c55e",    # green
}


def format_category(code: str) -> str:
    return CATEGORY_LABELS.get(code, code)


def format_priority(code: str) -> str:
    return PRIORITY_LABELS.get(code, code)


def priority_color(code: str) -> str:
    return PRIORITY_COLORS.get(code, "#6b7280")


def truncate_az(text: str, max_chars: int = 200) -> str:
    """Truncate Azerbaijani text at word boundary."""
    if len(text) <= max_chars:
        return text
    truncated = text[:max_chars]
    last_space = truncated.rfind(" ")
    if last_space > 0:
        truncated = truncated[:last_space]
    return truncated + "…"
