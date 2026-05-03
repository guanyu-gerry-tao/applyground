#!/usr/bin/env python3
"""Add derived job-level metadata to sanitized posting JSONL."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


LEVEL_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("intern", re.compile(r"\b(intern|internship|co-?op|student)\b", re.IGNORECASE)),
    ("junior", re.compile(r"\b(junior|jr\.?|entry[ -]?level|new grad|new graduate|graduate)\b", re.IGNORECASE)),
    ("senior", re.compile(r"\b(senior|sr\.?)\b", re.IGNORECASE)),
    ("staff", re.compile(r"\bstaff\b", re.IGNORECASE)),
    ("principal", re.compile(r"\b(principal|distinguished|fellow)\b", re.IGNORECASE)),
    ("lead", re.compile(r"\b(lead|tech lead)\b", re.IGNORECASE)),
    ("manager", re.compile(r"\b(manager|director|head of|vp|vice president)\b", re.IGNORECASE)),
]

COMPOSITE_LEVELS = {
    ("senior", "staff"): "senior_staff",
    ("senior", "principal"): "senior_principal",
    ("senior", "manager"): "senior_manager",
    ("staff", "manager"): "staff_manager",
    ("lead", "manager"): "lead_manager",
}

LEVEL_PRIORITY = [
    "intern",
    "junior",
    "senior_staff",
    "senior_principal",
    "senior_manager",
    "principal",
    "staff",
    "senior",
    "lead_manager",
    "staff_manager",
    "manager",
    "lead",
]


def infer_job_level(title: str) -> dict[str, Any]:
    """Infer a coarse job level from a sanitized core title."""
    signals = [name for name, pattern in LEVEL_PATTERNS if pattern.search(title)]
    signal_set = set(signals)

    candidates: set[str] = set(signals)
    for required_signals, level in COMPOSITE_LEVELS.items():
        if set(required_signals).issubset(signal_set):
            candidates.add(level)

    job_level = "unspecified"
    for level in LEVEL_PRIORITY:
        if level in candidates:
            job_level = level
            break
    return {"job_level": job_level, "job_level_signals": signals}


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    """Load one JSON object per line."""
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            line = line.strip()
            if not line:
                continue
            value = json.loads(line)
            if not isinstance(value, dict):
                raise ValueError(f"{path}:{line_number} is not a JSON object")
            rows.append(value)
    return rows


def add_levels(rows: list[dict[str, Any]], title_field: str) -> list[dict[str, Any]]:
    """Return rows with job_level fields derived from the existing title."""
    output: list[dict[str, Any]] = []
    missing_titles: list[str] = []
    for row in rows:
        title = str(row.get(title_field) or "").strip()
        if not title:
            missing_titles.append(str(row.get("custom_id") or row.get("id") or "unknown"))
            continue

        # Keep the original row shape and add only derived metadata.
        updated = dict(row)
        updated.update(infer_job_level(title))
        output.append(updated)

    if missing_titles:
        preview = ", ".join(missing_titles[:5])
        raise KeyError(f"Missing {title_field!r} for {len(missing_titles)} rows: {preview}")
    return output


def write_jsonl(rows: list[dict[str, Any]], path: Path) -> None:
    """Write one JSON object per line."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def main() -> int:
    """Run the level enrichment command."""
    parser = argparse.ArgumentParser(description="Add job_level metadata to sanitized posting JSONL.")
    parser.add_argument("input", help="Input JSONL that already contains sanitized title values.")
    parser.add_argument("output", help="Output JSONL with job_level metadata.")
    parser.add_argument("--title-field", default="title", help="Title field to inspect. Default: title.")
    args = parser.parse_args()

    rows = load_jsonl(Path(args.input))
    output_rows = add_levels(rows, args.title_field)
    write_jsonl(output_rows, Path(args.output))
    print(f"Added job_level metadata to {len(output_rows)} rows into {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
