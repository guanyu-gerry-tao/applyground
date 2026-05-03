#!/usr/bin/env python3
"""Apply deterministic NPC replacement pools to sanitized JSONL rows."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


TOKEN_RE = re.compile(r"\{\{[A-Z_]+\}\}")


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    """Load a JSONL file as a list of objects."""
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


def apply_replacements(text: str, replacements: dict[str, str]) -> str:
    """Replace placeholder tokens in text with values from one NPC pool row."""
    def replace_match(match: re.Match[str]) -> str:
        token = match.group(0)
        return replacements.get(token, token)

    return TOKEN_RE.sub(replace_match, text)


def apply_pool_row(row: dict[str, Any], pool_row: dict[str, Any], field: str) -> dict[str, Any]:
    """Apply one pool row to one input row."""
    replacements = pool_row.get("replacements")
    if not isinstance(replacements, dict):
        raise ValueError("pool row is missing a replacements object")

    replacement_map = {str(key): str(value) for key, value in replacements.items()}
    updated = dict(row)
    value = updated.get(field, "")
    if not isinstance(value, str):
        raise ValueError(f"input field {field!r} must be a string")

    updated[field] = apply_replacements(value, replacement_map)
    updated["npc_seed"] = str(pool_row.get("seed", ""))
    return updated


def write_jsonl(rows: list[dict[str, Any]], path: Path) -> None:
    """Write JSONL rows to disk."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def main() -> int:
    """Run the replacement command."""
    parser = argparse.ArgumentParser(description="Apply NPC replacement JSONL rows to sanitized JSONL content.")
    parser.add_argument("input", help="Input sanitized JSONL.")
    parser.add_argument("pool", help="NPC identity pool JSONL.")
    parser.add_argument("output", help="Output JSONL with placeholders replaced.")
    parser.add_argument("--field", default="html", help="String field to replace. Default: html.")
    args = parser.parse_args()

    input_rows = load_jsonl(Path(args.input))
    pool_rows = load_jsonl(Path(args.pool))

    if len(pool_rows) < len(input_rows):
        print(f"pool has {len(pool_rows)} rows, but input has {len(input_rows)} rows", file=sys.stderr)
        return 2

    output_rows = [apply_pool_row(row, pool_row, args.field) for row, pool_row in zip(input_rows, pool_rows)]
    write_jsonl(output_rows, Path(args.output))
    print(f"Replaced {len(output_rows)} rows into {args.output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
