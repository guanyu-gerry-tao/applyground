#!/usr/bin/env python3
"""Tests for deterministic NPC replacement-pool generation."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name("generate_npc_pool.py")


def load_module():
    spec = importlib.util.spec_from_file_location("generate_npc_pool", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class NpcPoolTests(unittest.TestCase):
    def test_identity_generation_is_deterministic_and_complete(self) -> None:
        module = load_module()

        first = module.generate_identity("jd-000001")
        second = module.generate_identity("jd-000001")

        self.assertEqual(first, second)
        self.assertEqual(
            set(first["replacements"]),
            {
                "{{COMPANY_NAME}}",
                "{{NPC_PRODUCT}}",
                "{{NPC_NAME}}",
                "{{NPC_URL}}",
                "{{NPC_EMAIL}}",
                "{{NPC_PHONE}}",
                "{{NPC_RECRUITER}}",
                "{{NPC_ADDRESS}}",
            },
        )

    def test_generated_values_use_reserved_contact_surfaces(self) -> None:
        module = load_module()

        identity = module.generate_identity("jd-000042")["replacements"]

        self.assertIn(".example.test/", identity["{{NPC_URL}}"])
        self.assertTrue(identity["{{NPC_EMAIL}}"].endswith("@example.test"))
        self.assertRegex(identity["{{NPC_PHONE}}"], r"^\+1 555-01\d{2}-\d{4}$")

    def test_names_avoid_denied_context_terms(self) -> None:
        module = load_module()

        for index in range(100):
            identity = module.generate_identity(f"jd-{index:06d}")["replacements"]
            checked_values = [
                identity["{{COMPANY_NAME}}"],
                identity["{{NPC_PRODUCT}}"],
                identity["{{NPC_NAME}}"],
                identity["{{NPC_RECRUITER}}"],
            ]
            joined = " ".join(checked_values).lower()
            for term in module.DENYLIST:
                self.assertNotIn(term, joined)

    def test_cli_writes_requested_number_of_jsonl_rows(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            output_path = Path(tmp_dir) / "npc_pool.jsonl"
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT_PATH),
                    "--count",
                    "3",
                    "--seed-prefix",
                    "case",
                    "--output",
                    str(output_path),
                ],
                check=False,
                text=True,
                capture_output=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            rows = [json.loads(line) for line in output_path.read_text(encoding="utf-8").splitlines()]
            self.assertEqual([row["seed"] for row in rows], ["case-000001", "case-000002", "case-000003"])


if __name__ == "__main__":
    unittest.main()
