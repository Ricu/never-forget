from __future__ import annotations

import argparse
import json
from pathlib import Path

from backend.bootstrap import build_service
from backend.observability import flush_traces


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest one capture session")
    parser.add_argument(
        "--capture-session-id", help="Optional explicit capture session id"
    )
    parser.add_argument("--text", help="Raw transcription text")
    parser.add_argument(
        "--file",
        help="Path to .txt/.md transcript file or supported audio file",
    )
    parser.add_argument(
        "--model", help="Override extraction model, e.g. openai:gpt-4.1-mini"
    )
    args = parser.parse_args()
    if bool(args.text) == bool(args.file):
        parser.error("Provide exactly one of --text or --file")
    return args


def main() -> None:
    args = parse_args()
    service = build_service(model_name=args.model)

    try:
        if args.text:
            result = service.ingest_text(
                text=args.text,
                capture_session_id=args.capture_session_id,
            )
        else:
            result = service.ingest_file(
                file_path=Path(args.file),
                capture_session_id=args.capture_session_id,
            )
        print(json.dumps(result.model_dump(mode="json"), indent=2))
    finally:
        flush_traces()


if __name__ == "__main__":
    main()
