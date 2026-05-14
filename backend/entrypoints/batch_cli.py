from __future__ import annotations

import argparse
import json
from pathlib import Path

from backend.bootstrap import build_service
from backend.entrypoints.common import load_batch_sources
from backend.observability import flush_traces


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Batch ingest capture sessions")
    parser.add_argument(
        "--input",
        required=True,
        help="Path to folder, .jsonl, .json, or single text/audio file",
    )
    parser.add_argument(
        "--model", help="Override extraction model, e.g. openai:gpt-4.1-mini"
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    service = build_service(model_name=args.model)
    try:
        sources = load_batch_sources(
            path=Path(args.input),
            audio_suffixes=service.supported_audio_suffixes(),
        )
        results = service.ingest_batch(sources)
        payload = [result.model_dump(mode="json") for result in results]
        print(json.dumps(payload, indent=2))
    finally:
        flush_traces()


if __name__ == "__main__":
    main()
