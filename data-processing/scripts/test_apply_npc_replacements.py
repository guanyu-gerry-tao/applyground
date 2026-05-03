#!/usr/bin/env python3
"""Tests for applying NPC replacement pools to sanitized JSONL rows."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name("apply_npc_replacements.py")


def load_module():
    spec = importlib.util.spec_from_file_location("apply_npc_replacements", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ApplyNpcReplacementTests(unittest.TestCase):
    def test_replace_tokens_adds_audit_seed_and_keeps_other_fields(self) -> None:
        module = load_module()
        row = {"id": 7, "custom_id": "row-7", "html": "{{COMPANY_NAME}} uses {{NPC_URL}}."}
        pool_row = {
            "seed": "npc-000001",
            "replacements": {
                "{{COMPANY_NAME}}": "Zavul Labs",
                "{{NPC_URL}}": "https://careers.example.test/jobs/npc-000001",
            },
        }

        replaced = module.apply_pool_row(row, pool_row, "html")

        self.assertEqual(replaced["id"], 7)
        self.assertEqual(
            replaced["html"],
            "Zavul Labs uses https://careers.example.test/jobs/npc-000001.",
        )
        self.assertEqual(replaced["npc_seed"], "npc-000001")

    def test_cli_replaces_jsonl_by_line_order(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.jsonl"
            pool_path = tmp_path / "pool.jsonl"
            output_path = tmp_path / "output.jsonl"

            input_path.write_text(
                json.dumps({"id": 1, "html": "{{COMPANY_NAME}}"}) + "\n"
                + json.dumps({"id": 2, "html": "{{NPC_NAME}}"}) + "\n",
                encoding="utf-8",
            )
            pool_path.write_text(
                json.dumps({"seed": "a", "replacements": {"{{COMPANY_NAME}}": "Qrax Lab"}}) + "\n"
                + json.dumps({"seed": "b", "replacements": {"{{NPC_NAME}}": "Vekqor Zharix"}}) + "\n",
                encoding="utf-8",
            )

            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT_PATH),
                    str(input_path),
                    str(pool_path),
                    str(output_path),
                ],
                check=False,
                text=True,
                capture_output=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            rows = [json.loads(line) for line in output_path.read_text(encoding="utf-8").splitlines()]
            self.assertEqual(rows[0]["html"], "Qrax Lab")
            self.assertEqual(rows[1]["html"], "Vekqor Zharix")
            self.assertEqual(rows[1]["npc_seed"], "b")

    def test_cli_fails_when_pool_is_too_short(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.jsonl"
            pool_path = tmp_path / "pool.jsonl"
            output_path = tmp_path / "output.jsonl"

            input_path.write_text('{"html":"{{COMPANY_NAME}}"}\n{"html":"{{COMPANY_NAME}}"}\n', encoding="utf-8")
            pool_path.write_text('{"seed":"only","replacements":{"{{COMPANY_NAME}}":"Only Lab"}}\n', encoding="utf-8")

            result = subprocess.run(
                [sys.executable, str(SCRIPT_PATH), str(input_path), str(pool_path), str(output_path)],
                check=False,
                text=True,
                capture_output=True,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("pool has 1 rows, but input has 2 rows", result.stderr)


if __name__ == "__main__":
    unittest.main()
