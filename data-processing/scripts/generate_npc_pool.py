#!/usr/bin/env python3
"""Generate deterministic NPC replacement identities for sanitized job postings."""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
import sys
from pathlib import Path
from typing import TextIO


SOFT_COMPONENTS = [
    "vul",
    "qen",
    "ryl",
    "mav",
    "nox",
    "xel",
    "dax",
    "zav",
    "rul",
    "qel",
]

HARD_COMPONENTS = [
    "vek",
    "rix",
    "kry",
    "qor",
    "nex",
    "tor",
    "kel",
    "zun",
    "drek",
    "vorn",
    "qrax",
    "tov",
    "keth",
]

ALIEN_COMPONENTS = [
    "qir",
    "vyr",
    "thur",
    "dra",
    "ul",
    "xen",
    "zor",
    "vyx",
    "zha",
]

COMPANY_SUFFIXES = ["Group", "Lab", "Labs", "Systems", "Works"]
PRODUCT_SUFFIXES = ["Portal", "Console", "Hub", "Desk"]

DENYLIST = {
    "amazon",
    "apple",
    "google",
    "meta",
    "microsoft",
    "openai",
    "tesla",
    "workday",
    "linkedin",
    "greenhouse",
    "lever",
    "ashby",
    "indeed",
    "cyber",
    "quantum",
    "nebula",
    "prime",
    "empire",
    "dominion",
    "galaxy",
    "star",
    "nova",
    "health",
    "finance",
    "bank",
    "defense",
    "medical",
    "school",
    "university",
}

TOKEN_KEYS = [
    "{{COMPANY_NAME}}",
    "{{NPC_PRODUCT}}",
    "{{NPC_NAME}}",
    "{{NPC_URL}}",
    "{{NPC_EMAIL}}",
    "{{NPC_PHONE}}",
    "{{NPC_RECRUITER}}",
    "{{NPC_ADDRESS}}",
]


def rng_for_seed(seed: str, namespace: str = "") -> random.Random:
    """Create a stable random stream from a seed and optional namespace."""
    digest = hashlib.sha256(f"{namespace}:{seed}".encode("utf-8")).digest()
    return random.Random(int.from_bytes(digest[:8], "big"))


def title_join(parts: list[str]) -> str:
    """Join generated components into one readable proper-name token."""
    return "".join(parts).capitalize()


def component_name(rng: random.Random, min_parts: int, max_parts: int) -> str:
    """Build one pronounceable low-semantics token with at most one alien component."""
    length = rng.randint(min_parts, max_parts)
    parts: list[str] = []
    alien_used = False

    for _ in range(length):
        if not alien_used and rng.random() < 0.38:
            parts.append(rng.choice(ALIEN_COMPONENTS))
            alien_used = True
        elif rng.random() < 0.62:
            parts.append(rng.choice(HARD_COMPONENTS))
        else:
            parts.append(rng.choice(SOFT_COMPONENTS))

    return title_join(parts)


def reject_context_terms(*values: str) -> bool:
    """Return True when generated values contain any denied real or context-heavy term."""
    text = " ".join(values).lower()
    return any(term in text for term in DENYLIST)


def unique_name(rng: random.Random, min_parts: int, max_parts: int, existing: set[str]) -> str:
    """Generate a unique name token that avoids the local denylist."""
    for _ in range(100):
        name = component_name(rng, min_parts, max_parts)
        if name not in existing and not reject_context_terms(name):
            existing.add(name)
            return name
    raise RuntimeError("Could not generate a safe NPC name after 100 attempts")


def slugify_seed(seed: str) -> str:
    """Make a seed safe for reserved URLs and email local-parts."""
    slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", seed).strip("-").lower()
    return slug or "npc"


def generate_identity(seed: str) -> dict[str, object]:
    """Generate one deterministic replacement map for the sanitized placeholder tokens."""
    rng = rng_for_seed(seed)
    existing: set[str] = set()

    company_root = unique_name(rng, 2, 3, existing)
    company_name = f"{company_root} {rng.choice(COMPANY_SUFFIXES)}"
    product_root = unique_name(rng, 2, 3, existing)
    product_name = product_root if rng.random() < 0.45 else f"{product_root} {rng.choice(PRODUCT_SUFFIXES)}"

    first_name = unique_name(rng, 2, 2, existing)
    last_name = unique_name(rng, 2, 2, existing)
    npc_name = f"{first_name} {last_name}"

    slug = slugify_seed(seed)
    phone_mid = rng.randint(0, 99)
    phone_tail = rng.randint(0, 9999)
    street_number = rng.randint(100, 9899)
    suite = rng.randint(100, 899)
    street_root = unique_name(rng, 2, 3, existing)

    replacements = {
        "{{COMPANY_NAME}}": company_name,
        "{{NPC_PRODUCT}}": product_name,
        "{{NPC_NAME}}": npc_name,
        "{{NPC_URL}}": f"https://careers.example.test/jobs/{slug}",
        "{{NPC_EMAIL}}": f"recruiting+{slug}@example.test",
        "{{NPC_PHONE}}": f"+1 555-01{phone_mid:02d}-{phone_tail:04d}",
        "{{NPC_RECRUITER}}": npc_name,
        "{{NPC_ADDRESS}}": f"{street_number} {street_root} Way, Suite {suite}, Test City, CA 94000",
    }

    if set(replacements) != set(TOKEN_KEYS):
        raise RuntimeError("Internal error: replacement map does not match token keys")
    return {"seed": seed, "replacements": replacements}


def iter_identities(count: int, seed_prefix: str) -> list[dict[str, object]]:
    """Generate a numbered identity pool."""
    return [generate_identity(f"{seed_prefix}-{index:06d}") for index in range(1, count + 1)]


def write_jsonl(rows: list[dict[str, object]], output: TextIO) -> None:
    """Write the pool as one JSON object per line."""
    for row in rows:
        output.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def positive_int(value: str) -> int:
    """Parse a positive integer for argparse."""
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be positive")
    return parsed


def main() -> int:
    """Run the NPC pool generator."""
    parser = argparse.ArgumentParser(
        description="Generate deterministic fictional NPC replacement pools for sanitized job postings."
    )
    parser.add_argument("--count", type=positive_int, default=256, help="Number of identities to generate.")
    parser.add_argument("--seed-prefix", default="npc", help="Prefix for numbered deterministic seeds.")
    parser.add_argument("--output", help="Output JSONL path. Defaults to stdout.")
    args = parser.parse_args()

    rows = iter_identities(args.count, args.seed_prefix)
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as handle:
            write_jsonl(rows, handle)
        print(f"Wrote {len(rows)} NPC identities to {output_path}", file=sys.stderr)
    else:
        write_jsonl(rows, sys.stdout)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
