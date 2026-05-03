#!/usr/bin/env python3
"""Randomly sample CSV or Parquet records with optional keyword filtering."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Iterable


def parse_keywords(repeated: list[str], combined: str | None) -> list[str]:
    """Normalize repeated and comma-separated keyword inputs into one list."""
    # Collect values from repeated --keyword flags.
    keywords: list[str] = []
    keywords.extend(k.strip() for k in repeated if k.strip())

    # Collect values from a single comma-separated --keywords string.
    if combined:
        keywords.extend(k.strip() for k in combined.split(",") if k.strip())
    return keywords


def sql_quote(value: str) -> str:
    """Quote a string literal for DuckDB SQL."""
    return "'" + value.replace("'", "''") + "'"


def ident_quote(value: str) -> str:
    """Quote a column identifier for DuckDB SQL."""
    return '"' + value.replace('"', '""') + '"'


def build_reader(source_format: str, input_path: str) -> str:
    """Build the DuckDB table function used to read the datasource."""
    # Quote the path because it may contain glob characters or spaces.
    path = sql_quote(input_path)

    # Parquet may use Hive-style folders such as date=.../source=....
    if source_format == "parquet":
        return f"read_parquet({path}, hive_partitioning=true, union_by_name=true)"

    # CSV autodetection keeps the script lightweight for sample files.
    if source_format == "csv":
        return f"read_csv_auto({path}, union_by_name=true)"
    raise ValueError(f"Unsupported format: {source_format}")


def get_columns(con, reader_sql: str) -> list[str]:
    """Return column names from a DuckDB reader SQL expression."""
    # DESCRIBE is cheap and avoids loading the full datasource.
    rows = con.execute(f"DESCRIBE SELECT * FROM {reader_sql} LIMIT 1").fetchall()
    return [row[0] for row in rows]


def build_search_expr(columns: Iterable[str]) -> str:
    """Build a text expression that concatenates searchable columns."""
    # Cast every selected column to text so keywords can search mixed schemas.
    parts = [f"coalesce(cast({ident_quote(column)} as varchar), '')" for column in columns]
    return " || ' ' || ".join(parts) if parts else "''"


def build_where_clause(search_expr: str, keywords: list[str], mode: str) -> str:
    """Build the fuzzy keyword predicate for the SQL WHERE clause."""
    # No keyword clause is needed when the caller only wants random sampling.
    if not keywords:
        return ""

    # Use lower-case LIKE matching so keyword filters are case-insensitive.
    clauses = [f"lower({search_expr}) LIKE {sql_quote('%' + keyword.lower() + '%')}" for keyword in keywords]
    joiner = " AND " if mode == "all" else " OR "
    return "(" + joiner.join(clauses) + ")"


def parse_where_in(filters: list[str]) -> dict[str, list[str]]:
    """Parse exact filters from column=value1,value2 command-line inputs."""
    # Merge repeated --where-in filters by column.
    parsed: dict[str, list[str]] = {}
    for raw_filter in filters:
        # Each filter must name one column and one or more exact values.
        if "=" not in raw_filter:
            raise ValueError(f"--where-in must look like column=value1,value2: {raw_filter}")
        column, raw_values = raw_filter.split("=", 1)
        column = column.strip()
        values = [value.strip() for value in raw_values.split(",") if value.strip()]
        if not column or not values:
            raise ValueError(f"--where-in must include a column and at least one value: {raw_filter}")
        parsed.setdefault(column, []).extend(values)
    return parsed


def build_exact_filter_clauses(filters: dict[str, list[str]], columns: list[str]) -> list[str]:
    """Build exact-match SQL predicates for --where-in filters."""
    # Fail early if the user typed a column that is not in the datasource.
    unknown = sorted(set(filters) - set(columns))
    if unknown:
        raise KeyError(f"Unknown --where-in columns: {', '.join(unknown)}")

    # Use IN (...) so company/source filters do not accidentally match substrings.
    clauses: list[str] = []
    for column, values in filters.items():
        value_sql = ", ".join(sql_quote(value) for value in values)
        clauses.append(f"cast({ident_quote(column)} as varchar) IN ({value_sql})")
    return clauses


def write_jsonl(rows: list[tuple], columns: list[str], output_path: str | None) -> None:
    """Write sampled rows as JSONL."""
    # Write to stdout when no output path is provided.
    handle = open(output_path, "w", encoding="utf-8") if output_path else sys.stdout
    try:
        for row in rows:
            handle.write(json.dumps(dict(zip(columns, row)), ensure_ascii=False, default=str) + "\n")
    finally:
        if output_path:
            handle.close()


def write_csv(rows: list[tuple], columns: list[str], output_path: str | None) -> None:
    """Write sampled rows as CSV."""
    # Use newline="" so Python's CSV writer controls line endings.
    handle = open(output_path, "w", encoding="utf-8", newline="") if output_path else sys.stdout
    try:
        writer = csv.writer(handle)
        writer.writerow(columns)
        writer.writerows(rows)
    finally:
        if output_path:
            handle.close()


def resolve_output_format(output_path: str | None, requested_format: str | None) -> str:
    """Choose the output format from an explicit flag or file extension."""
    # An explicit --output-format always wins.
    if requested_format:
        return requested_format

    # Otherwise infer from common file extensions.
    if output_path:
        suffix = Path(output_path).suffix.lower()
        if suffix == ".csv":
            return "csv"
        if suffix in {".jsonl", ".ndjson"}:
            return "jsonl"
    return "jsonl"


def main() -> int:
    """Run the command-line sampler."""
    # Define the CLI surface in one place.
    parser = argparse.ArgumentParser(
        description="Randomly sample records from CSV or Parquet, optionally filtered by keywords."
    )
    parser.add_argument("format", choices=["csv", "parquet"], help="Input format.")
    parser.add_argument("input", help="Input file path or glob, for example 'data/**/*.parquet'.")
    parser.add_argument("count", type=int, help="Number of records to sample.")
    parser.add_argument(
        "--keyword",
        action="append",
        default=[],
        help="Keyword to match. Repeat this flag for a list, e.g. --keyword engineer --keyword data.",
    )
    parser.add_argument(
        "--keywords",
        help='Comma-separated keyword list, e.g. --keywords "engineer,data analyst,customer support".',
    )
    parser.add_argument(
        "--keyword-mode",
        choices=["any", "all"],
        default="any",
        help="Whether any keyword or all keywords must match. Default: any.",
    )
    parser.add_argument(
        "--search-columns",
        help="Comma-separated columns to search. Default: all columns cast to text.",
    )
    parser.add_argument(
        "--where-in",
        action="append",
        default=[],
        help="Exact filter in column=value1,value2 form. Repeat for multiple filters.",
    )
    parser.add_argument("--output", help="Output file. Defaults to stdout.")
    parser.add_argument(
        "--output-format",
        choices=["jsonl", "csv"],
        help="Output format. Defaults to the --output extension when it is .csv, .jsonl, or .ndjson; otherwise jsonl.",
    )
    parser.add_argument("--seed", type=int, help="Optional random seed for repeatable sampling.")
    args = parser.parse_args()

    # Refuse impossible sample sizes before touching the datasource.
    if args.count <= 0:
        parser.error("count must be positive")

    # Import DuckDB lazily so --help still works without dependencies installed.
    try:
        import duckdb
    except ModuleNotFoundError:
        print(
            "Missing dependency: duckdb. Install it with `python -m pip install duckdb`.",
            file=sys.stderr,
        )
        return 2

    # Initialize DuckDB and optionally make random sampling repeatable.
    con = duckdb.connect()
    if args.seed is not None:
        con.execute(f"SELECT setseed({args.seed / 2147483647.0})")

    # Inspect the datasource schema before building filters.
    reader_sql = build_reader(args.format, args.input)
    columns = get_columns(con, reader_sql)

    # Decide which columns participate in fuzzy keyword search.
    if args.search_columns:
        search_columns = [column.strip() for column in args.search_columns.split(",") if column.strip()]
        unknown = sorted(set(search_columns) - set(columns))
        if unknown:
            parser.error(f"Unknown search columns: {', '.join(unknown)}")
    else:
        search_columns = columns

    # Combine exact filters and fuzzy keyword filters into one WHERE clause.
    keywords = parse_keywords(args.keyword, args.keywords)
    search_expr = build_search_expr(search_columns)
    filter_clauses = build_exact_filter_clauses(parse_where_in(args.where_in), columns)
    keyword_clause = build_where_clause(search_expr, keywords, args.keyword_mode)
    if keyword_clause:
        filter_clauses.append(keyword_clause)
    where_clause = "WHERE " + " AND ".join(filter_clauses) if filter_clauses else ""

    # Randomize the matching rows and keep only the requested sample size.
    query = f"""
        SELECT *
        FROM {reader_sql}
        {where_clause}
        ORDER BY random()
        LIMIT {args.count}
    """

    # Execute the query and keep result column names for CSV/JSONL output.
    cursor = con.execute(query)
    rows = cursor.fetchall()
    result_columns = [desc[0] for desc in cursor.description]

    # Create parent directories for file output.
    if args.output:
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)

    # Emit the requested output format.
    output_format = resolve_output_format(args.output, args.output_format)
    if output_format == "csv":
        write_csv(rows, result_columns, args.output)
    else:
        write_jsonl(rows, result_columns, args.output)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
