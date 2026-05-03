#!/usr/bin/env python3
"""Extract HTML text from OpenAI Batch API output JSONL."""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path
from typing import Any


UNSAFE_ATTRIBUTE_RE = re.compile(
    r"""\s(?:data-[\w:-]+|href|src|srcset)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)""",
    re.IGNORECASE,
)


def response_text(item: dict[str, Any]) -> str:
    """Return concatenated text output from one Batch API result item."""
    # Failed batch rows do not have a response body.
    response = item.get("response") or {}
    body = response.get("body") or {}

    # Responses API stores text under output[].content[].
    chunks: list[str] = []
    for output in body.get("output", []):
        for content in output.get("content", []):
            if content.get("type") in {"output_text", "text"}:
                chunks.append(content.get("text", ""))
    return "".join(chunks)


def clean_html_attributes(html: str) -> str:
    """Remove invisible or link-like attributes from extracted HTML."""
    # Strip attributes that can preserve source IDs, tracking, or real links.
    return UNSAFE_ATTRIBUTE_RE.sub("", html)


def load_output_rows(path: Path) -> list[dict[str, Any]]:
    """Load OpenAI Batch API output JSONL rows."""
    # Keep this strict so malformed batch outputs fail loudly.
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            line = line.strip()
            if not line:
                continue
            value = json.loads(line)
            if not isinstance(value, dict):
                raise ValueError(f"Line {line_number} is not a JSON object")
            rows.append(value)
    return rows


def write_html_jsonl(rows: list[dict[str, Any]], output_path: Path) -> None:
    """Write one JSONL row per generated HTML fragment."""
    # JSONL keeps a stable local id plus custom_id for later joins.
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        for index, item in enumerate(rows):
            handle.write(
                json.dumps(
                    {
                        "id": index,
                        "custom_id": item.get("custom_id"),
                        "html": clean_html_attributes(response_text(item)),
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )


def write_html_csv(rows: list[dict[str, Any]], output_path: Path) -> None:
    """Write extracted HTML fragments as CSV."""
    # CSV is convenient for spreadsheet review.
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["id", "custom_id", "html"])
        writer.writeheader()
        for index, item in enumerate(rows):
            writer.writerow(
                {
                    "id": index,
                    "custom_id": item.get("custom_id"),
                    "html": clean_html_attributes(response_text(item)),
                }
            )


def write_html_files(rows: list[dict[str, Any]], output_dir: Path) -> None:
    """Write one .html file per batch result."""
    # File output makes it easy to open individual generated postings.
    output_dir.mkdir(parents=True, exist_ok=True)
    for index, item in enumerate(rows, 1):
        custom_id = str(item.get("custom_id") or f"row-{index:06d}")
        safe_name = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "-" for ch in custom_id)[:180]
        (output_dir / f"{index:04d}-{safe_name}.html").write_text(
            clean_html_attributes(response_text(item)),
            encoding="utf-8",
        )


def infer_mode(output: Path, explicit_mode: str | None) -> str:
    """Choose output mode from a flag or output path extension."""
    # Explicit mode is clearer for scripts.
    if explicit_mode:
        return explicit_mode

    # Otherwise infer from the output path.
    suffix = output.suffix.lower()
    if suffix == ".csv":
        return "csv"
    if suffix in {".jsonl", ".ndjson"}:
        return "jsonl"
    return "files"


def main() -> int:
    """Run the batch HTML extraction command."""
    # Define the CLI surface in one place.
    parser = argparse.ArgumentParser(description="Extract generated HTML from OpenAI Batch output JSONL.")
    parser.add_argument("input", help="OpenAI Batch output JSONL path.")
    parser.add_argument("output", help="Output .jsonl/.csv file or directory for .html files.")
    parser.add_argument("--mode", choices=["jsonl", "csv", "files"], help="Output mode. Defaults from output path.")
    args = parser.parse_args()

    # Load raw batch output and choose the destination format.
    rows = load_output_rows(Path(args.input))
    output_path = Path(args.output)
    mode = infer_mode(output_path, args.mode)

    # Write the extracted HTML in the requested format.
    if mode == "jsonl":
        write_html_jsonl(rows, output_path)
    elif mode == "csv":
        write_html_csv(rows, output_path)
    elif mode == "files":
        write_html_files(rows, output_path)
    else:
        parser.error(f"Unsupported mode: {mode}")

    print(f"Extracted {len(rows)} rows to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
