"""Safe, deterministic normalization helpers for job search."""

import re
import unicodedata
from typing import Iterable


def normalize_search_text(value: object) -> str:
    """Normalize Unicode text into lowercase, single-spaced search text."""
    text = unicodedata.normalize("NFKC", str(value or "")).casefold().strip()
    return re.sub(r"\s+", " ", text)


def search_tokens(value: object) -> list[str]:
    """Return unique alphanumeric technology-friendly tokens."""
    tokens = re.findall(r"[a-z0-9+#.]+", normalize_search_text(value))
    return list(dict.fromkeys(tokens))


def unique_normalized(values: Iterable[object]) -> list[str]:
    """Normalize and de-duplicate values while preserving order."""
    return list(dict.fromkeys(filter(None, (normalize_search_text(value) for value in values))))


def prefix_pattern(value: str) -> str:
    """Return an escaped, index-friendly start-anchored prefix regex."""
    normalized = normalize_search_text(value)
    return rf"^{re.escape(normalized)}"
