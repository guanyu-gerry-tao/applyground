#!/usr/bin/env python3
"""Prepare and optionally submit OpenAI Batch API jobs for datasource rows."""

from __future__ import annotations

import argparse
import csv
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Iterable


OPENAI_API_BASE = "https://api.openai.com/v1"
OPENAI_BATCH_ENDPOINT = "/v1/responses"
DEFAULT_ENV_PATH = Path("data-processing/.env")
DEFAULT_OUTPUT_DIR = Path("data-processing/raw/batches")


def load_env(path: Path) -> None:
    """Load simple KEY=value pairs from a local env file into os.environ."""
    # Missing env files are allowed so CI/help commands can still run.
    if not path.exists():
        return

    # Parse a minimal dotenv format without adding another dependency.
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def resolve_provider_model(provider_override: str | None, model_override: str | None) -> tuple[str, str]:
    """Resolve AI provider and model from CLI overrides or environment variables."""
    # CLI flags are useful for one-off tests; env is the default workflow.
    provider = (provider_override or os.environ.get("AI_PROVIDER") or "").strip().lower()
    model = (model_override or os.environ.get("AI_MODEL") or "").strip()

    # Fail early with actionable messages when configuration is incomplete.
    if not provider:
        raise ValueError("Missing AI_PROVIDER. Add it to data-processing/.env or pass --provider.")
    if not model:
        raise ValueError("Missing AI_MODEL. Add it to data-processing/.env or pass --model.")
    return provider, model


def read_prompt_md(value: str) -> str:
    """Read the required Markdown prompt file."""
    # Prompts live in files so they are reviewable and versioned.
    path = Path(value)
    if not path.exists():
        raise FileNotFoundError(f"Prompt Markdown file not found: {path}")
    if path.suffix.lower() not in {".md", ".markdown"}:
        raise ValueError(f"Prompt file must be Markdown (.md or .markdown): {path}")
    return path.read_text(encoding="utf-8")


def detect_format(path: Path, requested: str) -> str:
    """Resolve a datasource format from a flag or file extension."""
    # Explicit datasource formats are useful when a path has no extension.
    if requested != "auto":
        return requested

    # Infer the common formats used in this data-processing workspace.
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return "csv"
    if suffix in {".jsonl", ".ndjson"}:
        return "jsonl"
    if suffix == ".parquet":
        return "parquet"
    raise ValueError("Could not infer datasource format. Pass --datasource-format.")


def load_csv(path: Path, limit: int | None) -> Iterable[dict[str, Any]]:
    """Yield rows from a CSV datasource as dictionaries."""
    # Job descriptions can exceed Python's default CSV field limit.
    csv.field_size_limit(sys.maxsize)

    # Stream rows so small --limit test runs do not read the whole file.
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for index, row in enumerate(reader):
            if limit is not None and index >= limit:
                break
            yield dict(row)


def load_jsonl(path: Path, limit: int | None) -> Iterable[dict[str, Any]]:
    """Yield rows from a JSONL datasource as dictionaries."""
    # Read one object per line, which matches many batch-processing artifacts.
    with path.open(encoding="utf-8") as handle:
        for index, line in enumerate(handle):
            if limit is not None and index >= limit:
                break
            line = line.strip()
            if not line:
                continue
            value = json.loads(line)

            # Keep the downstream payload builder simple by requiring objects.
            if not isinstance(value, dict):
                raise ValueError(f"JSONL row {index + 1} is not an object")
            yield value


def load_parquet(path: Path, limit: int | None) -> Iterable[dict[str, Any]]:
    """Yield rows from a Parquet datasource as dictionaries."""
    # DuckDB keeps Parquet reads fast without loading the whole dataset manually.
    try:
        import duckdb
    except ModuleNotFoundError as exc:
        raise RuntimeError("Reading parquet requires duckdb. Install data-processing/requirements.txt.") from exc

    # Push LIMIT into SQL so quick tests stay cheap.
    limit_sql = f"LIMIT {limit}" if limit is not None else ""
    con = duckdb.connect()
    rows = con.execute(
        f"SELECT * FROM read_parquet(?, hive_partitioning=true, union_by_name=true) {limit_sql}",
        [str(path)],
    ).fetchall()

    # Convert DuckDB tuples back to row dictionaries.
    columns = [desc[0] for desc in con.description]
    for row in rows:
        yield dict(zip(columns, row))


def load_rows(path: Path, source_format: str, limit: int | None) -> list[dict[str, Any]]:
    """Load rows from the requested datasource format."""
    # Dispatch to the format-specific reader.
    if source_format == "csv":
        return list(load_csv(path, limit))
    if source_format == "jsonl":
        return list(load_jsonl(path, limit))
    if source_format == "parquet":
        return list(load_parquet(path, limit))
    raise ValueError(f"Unsupported datasource format: {source_format}")


def parse_columns(value: str | None) -> list[str] | None:
    """Parse a comma-separated column list."""
    # None means the full row will be sent.
    if not value:
        return None
    return [column.strip() for column in value.split(",") if column.strip()]


def row_payload(row: dict[str, Any], columns: list[str] | None, text_column: str | None) -> str:
    """Build the user payload sent to the model for one row."""
    # A text column sends exactly one field, useful for description_html.
    if text_column:
        if text_column not in row:
            raise KeyError(f"Missing text column: {text_column}")
        return str(row.get(text_column) or "")

    # A column list sends a compact JSON object with only selected fields.
    if columns:
        missing = [column for column in columns if column not in row]
        if missing:
            raise KeyError(f"Missing columns: {', '.join(missing)}")
        selected = {column: row.get(column) for column in columns}
    else:
        # Full row is the most flexible default for early exploration.
        selected = row
    return json.dumps(selected, ensure_ascii=False, default=str)


def request_body(model: str, prompt: str, payload: str, max_output_tokens: int) -> dict[str, Any]:
    """Build one Responses API request body for the batch input file."""
    # Use the prompt as system instructions and one datasource row as user content.
    return {
        "model": model,
        "input": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": payload},
        ],
        "max_output_tokens": max_output_tokens,
    }


def make_custom_id(row: dict[str, Any], index: int, id_column: str | None) -> str:
    """Create a stable custom_id for one batch request."""
    # Prefer source IDs so output rows can be matched back to input rows.
    if id_column and row.get(id_column):
        raw_id = str(row[id_column])
    else:
        raw_id = f"row-{index + 1:06d}"

    # Prefix the row number because source datasets can contain duplicate job IDs.
    unique_id = f"row-{index + 1:06d}-{raw_id}"

    # Batch custom IDs should be compact and safe to inspect in JSONL output.
    safe = "".join(ch if ch.isalnum() or ch in {"-", "_", ":"} else "-" for ch in unique_id)
    return safe[:512]


def write_batch_input(
    rows: list[dict[str, Any]],
    output_path: Path,
    model: str,
    prompt: str,
    columns: list[str] | None,
    text_column: str | None,
    id_column: str | None,
    max_output_tokens: int,
) -> None:
    """Write an OpenAI Batch API input JSONL file."""
    # Raw batch files belong under ignored raw/ directories by convention.
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Each line is one independent API request for the batch worker.
    with output_path.open("w", encoding="utf-8") as handle:
        for index, row in enumerate(rows):
            payload = row_payload(row, columns, text_column)
            request = {
                "custom_id": make_custom_id(row, index, id_column),
                "method": "POST",
                "url": OPENAI_BATCH_ENDPOINT,
                "body": request_body(model, prompt, payload, max_output_tokens),
            }
            handle.write(json.dumps(request, ensure_ascii=False, default=str) + "\n")


def http_json(method: str, url: str, api_key: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
    """Send a JSON request to the OpenAI API and return the parsed response."""
    # Encode JSON only when the endpoint expects a body.
    data = json.dumps(body).encode("utf-8") if body is not None else None

    # Use urllib so the script does not require the OpenAI SDK.
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # Include API response text because validation errors are otherwise opaque.
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI API error {exc.code}: {detail}") from exc


def upload_file(path: Path, api_key: str) -> dict[str, Any]:
    """Upload a batch JSONL file to OpenAI with purpose=batch."""
    # Build a small multipart/form-data body without adding requests/httpx.
    boundary = "applyground-batch-boundary"
    file_bytes = path.read_bytes()
    filename = path.name
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    parts = [
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="purpose"\r\n\r\n'
        "batch\r\n",
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: {content_type}\r\n\r\n",
    ]

    # Combine metadata parts, file bytes, and multipart closing boundary.
    body = b"".join(part.encode("utf-8") for part in parts) + file_bytes + f"\r\n--{boundary}--\r\n".encode(
        "utf-8"
    )

    # Submit the upload request to /v1/files.
    request = urllib.request.Request(
        f"{OPENAI_API_BASE}/files",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    try:
        with urllib.request.urlopen(request) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # Surface file-validation errors, especially invalid JSONL.
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI file upload error {exc.code}: {detail}") from exc


def create_batch(input_file_id: str, api_key: str, metadata: dict[str, str]) -> dict[str, Any]:
    """Create an OpenAI batch for an uploaded input file."""
    # Batch API currently uses a 24h completion window.
    body: dict[str, Any] = {
        "input_file_id": input_file_id,
        "endpoint": OPENAI_BATCH_ENDPOINT,
        "completion_window": "24h",
    }

    # Metadata helps identify jobs later in the OpenAI dashboard/API.
    if metadata:
        body["metadata"] = metadata
    return http_json("POST", f"{OPENAI_API_BASE}/batches", api_key, body)


def resolve_api_key() -> str:
    """Return the configured API key for real OpenAI API calls."""
    api_key = os.environ.get("AI_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("AI_API_KEY is missing. Add it to data-processing/.env or the environment.")
    return api_key


def download_file(file_id: str, output_path: Path, api_key: str) -> None:
    """Download an OpenAI file content response to a local path."""
    request = urllib.request.Request(
        f"{OPENAI_API_BASE}/files/{file_id}/content",
        method="GET",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with urllib.request.urlopen(request) as response:
            output_path.write_bytes(response.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI file download error {exc.code}: {detail}") from exc


def main() -> int:
    """Run the batch-input creation and optional submission command."""
    # Define the CLI surface in one place.
    parser = argparse.ArgumentParser(
        description="Create OpenAI Batch API JSONL from a datasource and optionally submit it."
    )
    parser.add_argument("prompt_md", nargs="?", help="Path to a Markdown prompt file.")
    parser.add_argument("datasource", nargs="?", help="CSV, JSONL, or Parquet datasource path.")
    parser.add_argument("--provider", help="Override AI_PROVIDER from env. Currently only openai is supported.")
    parser.add_argument("--model", help="Override AI_MODEL from env.")
    parser.add_argument("--datasource-format", choices=["auto", "csv", "jsonl", "parquet"], default="auto")
    parser.add_argument("--columns", help="Comma-separated columns to send as JSON. Default: full row.")
    parser.add_argument("--text-column", help="Send only this column as the user payload.")
    parser.add_argument("--id-column", default="id", help="Column used for batch custom_id. Default: id.")
    parser.add_argument("--limit", type=int, help="Only include the first N rows.")
    parser.add_argument("--output", help="Batch input JSONL path. Default: data-processing/raw/batches/<datasource>.batch.jsonl")
    parser.add_argument("--max-output-tokens", type=int, default=2000)
    parser.add_argument("--env", default=str(DEFAULT_ENV_PATH), help="Env file path. Default: data-processing/.env")
    parser.add_argument("--submit", action="store_true", help="Upload the JSONL and create the OpenAI batch.")
    parser.add_argument("--status-batch", help="Fetch status JSON for an existing OpenAI batch id.")
    parser.add_argument("--download-batch", help="Download output JSONL for an existing completed OpenAI batch id.")
    parser.add_argument("--download-output", help="Path for --download-batch output JSONL.")
    args = parser.parse_args()

    # Load env config before resolving provider/model/API key.
    load_env(Path(args.env))

    if args.status_batch or args.download_batch:
        api_key = resolve_api_key()
        batch_id = args.status_batch or args.download_batch
        batch = http_json("GET", f"{OPENAI_API_BASE}/batches/{batch_id}", api_key)

        if args.status_batch:
            print(json.dumps(batch, indent=2, ensure_ascii=False))
            return 0

        output_file_id = batch.get("output_file_id")
        if not output_file_id:
            parser.error(f"Batch {batch_id} has no output_file_id yet; current status is {batch.get('status')}")
        if not args.download_output:
            parser.error("--download-output is required with --download-batch")
        download_file(str(output_file_id), Path(args.download_output), api_key)
        print(f"Downloaded {output_file_id} to {args.download_output}")
        return 0

    if not args.prompt_md or not args.datasource:
        parser.error("prompt_md and datasource are required unless using --status-batch or --download-batch")

    provider, model = resolve_provider_model(args.provider, args.model)

    # Keep provider dispatch explicit; only OpenAI is implemented today.
    if provider != "openai":
        parser.error("Only provider 'openai' is supported right now.")
    if args.limit is not None and args.limit <= 0:
        parser.error("--limit must be positive")

    # Resolve input files and read datasource rows.
    datasource_path = Path(args.datasource)
    source_format = detect_format(datasource_path, args.datasource_format)
    prompt = read_prompt_md(args.prompt_md)
    rows = load_rows(datasource_path, source_format, args.limit)
    if not rows:
        parser.error("Datasource produced zero rows.")

    # Build the local batch JSONL file.
    columns = parse_columns(args.columns)
    output_path = Path(args.output) if args.output else DEFAULT_OUTPUT_DIR / f"{datasource_path.stem}.batch.jsonl"
    write_batch_input(
        rows=rows,
        output_path=output_path,
        model=model,
        prompt=prompt,
        columns=columns,
        text_column=args.text_column,
        id_column=args.id_column,
        max_output_tokens=args.max_output_tokens,
    )

    print(f"Wrote batch input: {output_path}")
    print(f"Requests: {len(rows)}")

    # Dry-run is the default; --submit is required to spend API money.
    if not args.submit:
        print("Not submitted. Re-run with --submit to upload and create the batch.")
        return 0

    # Resolve the API key only when a real submission is requested.
    try:
        api_key = resolve_api_key()
    except ValueError as exc:
        parser.error(str(exc))

    # Upload the JSONL and create the asynchronous batch job.
    uploaded = upload_file(output_path, api_key)
    batch = create_batch(
        uploaded["id"],
        api_key,
        metadata={
            "project": "applyground",
            "datasource": datasource_path.name,
            "model": model,
        },
    )
    print(json.dumps({"file": uploaded, "batch": batch}, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
