"""Gemini Vision service — scene description + category + priority in Azerbaijani."""
from __future__ import annotations

import base64
import json
from typing import Any

from google import genai
from google.genai.types import GenerateContentConfig

from config import get_settings

settings = get_settings()

CATEGORIES = {
    "kommunal": "Kommunal xidmətlər (su, qaz, elektrik)",
    "yol_neqliyyat": "Yol və nəqliyyat",
    "infrastruktur": "İnfrastruktur (körpü, bina, arxitektura)",
    "ekoloji": "Ekoloji problemlər (çirklənmə, yanğın)",
    "diger": "Digər",
}

SYSTEM_PROMPT = """Siz Azərbaycan dilində vətəndaş müraciəti sisteminin AI analiz köməkçisisiniz.
Vətəndaşın göndərdiyi şəkli təhlil edib aşağıdakı JSON formatında cavab verin:

{
  "description_az": "şəkildəki problemi aydın, qısa Azərbaycan dilində izah edin, 1-2 cümlə",
  "category": "kommunal | yol_neqliyyat | infrastruktur | ekoloji | diger",
  "priority": "tecili | orta | asagi | yoxdur",
  "has_problem": true,
  "location_hint": "Şəkildə görünən küçə lövhələri, bina adları və ya ərazinin vizual xüsusiyyətləri əsasında məkanı təsvir et",
  "priority_reason": "prioritetin təyin edilmə səbəbi Azərbaycan dilində"
}

ÇOX VACİB — problem olub-olmadığını müəyyən etmək:
- Əvvəlcə şəkildə real bir problem (zədə, qəza, çirklənmə, nasazlıq) olub-olmadığını yoxlayın.
- Əgər şəkildə heç bir problem, zədə və ya təhlükə YOXDURSA: "has_problem": false, "priority": "yoxdur", "category": "diger", "description_az": "Şəkildə heç bir problem aşkar edilmədi." qaytarın.
- Normal küçə mənzərəsi, adi hava şəraiti (qar, yağış), normal binalar — bunlar problem DEYİL.

Prioritet qaydaları (yalnız real problem olduqda):
- tecili: yanğın, qaz sızması, böyük su basması, böyük çala, təhlükəli zədə
- orta: zədəli səki, axan zibil, qırıq işıq, orta dərəcəli zədə
- asagi: qraffiti, kiçik estetik zədə
Xəstəxana, məktəb yaxınlığında, uşaq və ya yaşlı görünən kontekstdə prioriteti artırın.
Yalnız JSON qaytarın, başqa heç nə yazmayın."""


async def analyze_image(image_bytes: bytes, yolo_objects: list[str] | None = None, gps_address: str | None = None) -> dict[str, Any]:
    """
    Send image to Gemini Vision and receive structured Azerbaijani analysis.
    """
    client = genai.Client(api_key=settings.gemini_api_key)

    b64 = base64.b64encode(image_bytes).decode("utf-8")

    # Build text prompt parts
    text_parts = [SYSTEM_PROMPT]

    if yolo_objects:
        objects_str = ", ".join(yolo_objects)
        text_parts.append(f"YOLO aşkar etdi: {objects_str}. Bu məlumatı nəzərə alaraq təhlil edin.")

    if gps_address:
        text_parts.append(f"GPS məlumatı: {gps_address}. location_hint sahəsini bu ünvanla başlat və şəkildəki vizual işarələrlə tamamla.")

    text_parts.append("Bu şəkli təhlil edin və yalnız JSON qaytarın.")

    response = await client.aio.models.generate_content(
        model=settings.gemini_model,
        contents=[
            {
                "role": "user",
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": b64,
                        }
                    },
                    {"text": "\n\n".join(text_parts)},
                ],
            }
        ],
        config=GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=2048,
            response_mime_type="application/json",
        ),
    )

    raw = response.text.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON from Gemini: {e}\nRaw response: {raw[:500]}")
