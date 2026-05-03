#!/usr/bin/env python3
"""Tests for job-level metadata enrichment."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name("add_job_levels.py")


def load_module():
    spec = importlib.util.spec_from_file_location("add_job_levels", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class AddJobLevelsTests(unittest.TestCase):
    def test_infer_job_level_from_sanitized_title(self) -> None:
        module = load_module()

        self.assertEqual(module.infer_job_level("Software Engineer Intern")["job_level"], "intern")
        self.assertEqual(module.infer_job_level("Software Engineer, New Grad")["job_level"], "junior")
        self.assertEqual(module.infer_job_level("Senior Staff Software Engineer")["job_level"], "senior_staff")
        self.assertEqual(module.infer_job_level("Principal Systems Engineer")["job_level"], "principal")
        self.assertEqual(module.infer_job_level("Engineering Manager")["job_level"], "manager")
        self.assertEqual(module.infer_job_level("Software Engineer")["job_level"], "unspecified")

    def test_cli_adds_level_to_existing_title_field(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.jsonl"
            output_path = tmp_path / "output.jsonl"
            input_path.write_text(
                json.dumps({"custom_id": "row-1", "title": "Senior Software Engineer", "html": "<p>x</p>"})
                + "\n"
                + json.dumps({"custom_id": "row-2", "title": "Software Engineer Intern", "html": "<p>y</p>"})
                + "\n",
                encoding="utf-8",
            )

            result = subprocess.run(
                [sys.executable, str(SCRIPT_PATH), str(input_path), str(output_path)],
                check=False,
                text=True,
                capture_output=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            rows = [json.loads(line) for line in output_path.read_text(encoding="utf-8").splitlines()]
            self.assertEqual(rows[0]["job_level"], "senior")
            self.assertEqual(rows[0]["job_level_signals"], ["senior"])
            self.assertEqual(rows[1]["job_level"], "intern")


if __name__ == "__main__":
    unittest.main()
