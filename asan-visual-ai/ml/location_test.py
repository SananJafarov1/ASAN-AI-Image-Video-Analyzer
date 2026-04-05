"""
Test Nominatim reverse geocoding with a real Baku coordinate.
Run from asan-visual-ai/ml/:
    python location_test.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from utils.image_utils import reverse_geocode


async def main():
    # Test coordinates — Baku city center (Fountain Square)
    test_coords = [
        (40.3777, 49.8920, "Baku - Fountain Square"),
        (40.4093, 49.8671, "Baku - Railway Station area"),
        (40.3667, 49.8352, "Baku - Heydar Aliyev Center"),
    ]

    print("Testing Nominatim reverse geocoding...\n")
    for lat, lon, label in test_coords:
        address = await reverse_geocode(lat, lon)
        print(f"[{label}]")
        print(f"  Coords  : {lat}, {lon}")
        print(f"  Result  : {address or 'No result'}")
        print()


if __name__ == "__main__":
    asyncio.run(main())
