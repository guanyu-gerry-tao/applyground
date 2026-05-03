#!/usr/bin/env python3
"""Tests for extracting sanitized title/html batch responses."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name("extract_batch_html.py")


def load_module():
    spec = importlib.util.spec_from_file_location("extract_batch_html", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ExtractBatchHtmlTests(unittest.TestCase):
    def test_output_row_reads_json_title_and_html_response(self) -> None:
        module = load_module()
        item = {
            "custom_id": "row-000001-demo",
            "response": {
                "body": {
                    "output": [
                        {
                            "content": [
                                {
                                    "type": "output_text",
                                    "text": '{"title":"Senior Software Engineer","html":"<p>Hello</p><a href=\\"https://real.example\\">x</a>"}',
                                }
                            ]
                        }
                    ]
                }
            },
        }

        row = module.output_row(item, 0)

        self.assertEqual(row["title"], "Senior Software Engineer")
        self.assertEqual(row["html"], "<p>Hello</p><a>x</a>")

    def test_output_row_keeps_legacy_html_only_response(self) -> None:
        module = load_module()
        item = {"custom_id": "row-000001-demo", "html": "<p>Legacy</p>"}

        row = module.output_row(item, 0)

        self.assertNotIn("title", row)
        self.assertEqual(row["html"], "<p>Legacy</p>")


if __name__ == "__main__":
    unittest.main()
