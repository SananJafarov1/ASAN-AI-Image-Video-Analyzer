"""Standalone YOLOv8 test script — run from asan-visual-ai/ml/"""
import sys
import json
from pathlib import Path

# Allow importing backend services from parent dir
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from services.yolo_service import detect


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Test YOLOv8 on a local image")
    parser.add_argument("image", help="Path to image file")
    args = parser.parse_args()

    image_path = Path(args.image)
    if not image_path.exists():
        print(f"[ERROR] File not found: {image_path}")
        sys.exit(1)

    image_bytes = image_path.read_bytes()
    print(f"[INFO] Running YOLO on: {image_path.name} ({len(image_bytes)//1024} KB)")

    result = detect(image_bytes)

    print(f"\n{'='*50}")
    print(f"Top damage class : {result['top_damage_class']}")
    print(f"Max priority wt  : {result['max_priority_weight']}")
    print(f"\nDetections ({len(result['objects'])}):")
    for obj in result["objects"]:
        print(
            f"  {obj['class']:25s}  conf={obj['confidence']:.2f}  "
            f"priority_wt={obj['priority_weight']}  bbox={obj['bbox']}"
        )

    print(f"\nFull JSON:\n{json.dumps(result, ensure_ascii=False, indent=2)}")


if __name__ == "__main__":
    main()
