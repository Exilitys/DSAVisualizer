"""Groundwork's context-integrity template adapted to this docs-only repo.

Uses the standard library. Checks real pointers and accepted review markers;
application identifiers are outside this profile while no app source exists.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "AGENTS.md", "README.md", "prd.md", "docs/development.md",
    "docs/architecture/invariants.md", "docs/backlog.md", "docs/prd/prd.md",
    "docs/specs/001-heap-insertion.md", "docs/architecture/system.md",
)
SKIP = {".git", "node_modules", ".next", "dist", "build", ".venv"}
LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
CONTRACTS = re.compile(r"^## Contract paths\s*\n.*?```text\s*\n(.*?)```", re.M | re.S)


def check(root: Path) -> list[str]:
    errors: list[str] = []
    assert REQUIRED and len(REQUIRED) == len(set(REQUIRED)), "invalid required-file config"
    for name in REQUIRED:
        if not (root / name).is_file():
            errors.append(f"missing required context file: {name}")
    if errors:
        return errors

    for source in root.rglob("*.md"):
        if any(part in SKIP for part in source.relative_to(root).parts):
            continue
        prose = re.sub(r"```.*?```", "", source.read_text(encoding="utf-8"), flags=re.S)
        for target in LINK.findall(prose):
            target = target.strip().strip("<>")
            parsed = urlsplit(target)
            if parsed.scheme or not parsed.path:
                continue
            path = (source.parent / unquote(parsed.path)).resolve()
            if not path.is_relative_to(root) or not path.exists():
                errors.append(f"{source.relative_to(root)}: broken local pointer {target}")

    lists = []
    for name in ("AGENTS.md", "docs/architecture/invariants.md"):
        match = CONTRACTS.search((root / name).read_text(encoding="utf-8"))
        paths = [line.strip() for line in match.group(1).splitlines() if line.strip()] if match else []
        if not paths:
            errors.append(f"{name}: missing or empty contract paths")
        for name_path in paths:
            path = (root / name_path).resolve()
            if not path.is_relative_to(root) or not path.exists():
                errors.append(f"{name}: contract path is not real: {name_path}")
        lists.append(paths)
    if lists[0] != lists[1]:
        errors.append("AGENTS.md contract paths differ from the invariants document")

    for name in ("docs/prd/prd.md", "docs/specs/001-heap-insertion.md"):
        text = (root / name).read_text(encoding="utf-8")
        if not re.search(r"^\*\*Status\.\*\* Accepted \d{4}-\d{2}-\d{2} by @\w+", text, re.M):
            errors.append(f"{name}: missing named human acceptance record")

    artifact = root / "docs/architecture/system.html"
    receipt = root / "docs/architecture/system.visual-check.json"
    try:
        evidence = json.loads(receipt.read_text(encoding="utf-8"))
        if evidence["status"] != "pass" or evidence["artifact"]["sha256"] != hashlib.sha256(artifact.read_bytes()).hexdigest():
            errors.append("diagram evidence is stale or failed")
    except (OSError, ValueError, KeyError) as error:
        errors.append(f"cannot verify diagram evidence: {error}")
    return errors


if __name__ == "__main__":
    failures = check(ROOT)
    for failure in failures:
        print(f"FAIL: {failure}")
    if failures:
        raise SystemExit(1)
    print("Passed: context pointers, contract mirrors, acceptance records, and diagram binding.")
    print("Application source/type/runtime checks are separate from this documentation guard.")
