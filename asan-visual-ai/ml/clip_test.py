"""Standalone CLIP similarity test — run from asan-visual-ai/ml/"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from services.clip_service import compare


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Test CLIP similarity between two images (before/after)"
    )
    parser.add_argument("before", help="Path to the original (before) image")
    parser.add_argument("after", help="Path to the result (after) image")
    args = parser.parse_args()

    before_path = Path(args.before)
    after_path = Path(args.after)

    for p in (before_path, after_path):
        if not p.exists():
            print(f"[ERROR] File not found: {p}")
            sys.exit(1)

    before_bytes = before_path.read_bytes()
    after_bytes = after_path.read_bytes()

    print(f"[INFO] Comparing:")
    print(f"  Before : {before_path.name}")
    print(f"  After  : {after_path.name}")
    print()

    result = compare(before_bytes, after_bytes)

    print(f"{'='*50}")
    print(f"Similarity score  : {result['similarity_score']:.4f}")
    print(f"Threshold         : {result['threshold']}")
    print(f"Same location?    : {'YES ✓' if result['same_location'] else 'NO ✗'}")
    print(f"{'='*50}")

    if result["same_location"]:
        print("\nVerdict: Likely same location — institution image is plausible.")
    else:
        print("\nVerdict: Suspicious — images appear to be from different locations.")


if __name__ == "__main__":
    main()
