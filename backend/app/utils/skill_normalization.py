"""Canonical skill normalization for recommendations and search."""

from typing import Iterable
from app.utils.search_normalization import normalize_search_text

ALIASES = {
    "react.js": "react", "reactjs": "react", "nodejs": "node.js",
    "node js": "node.js", "expressjs": "express.js", "nextjs": "next.js",
    "rest api": "rest api", "restful api": "rest api", "postgres": "postgresql",
    "mongo db": "mongodb", "powerbi": "power bi", "ci cd": "ci/cd",
}


def normalize_skill(value: object) -> str:
    """Return a canonical case-insensitive skill identifier."""
    normalized = normalize_search_text(value)
    return ALIASES.get(normalized, normalized)


def normalize_skills(values: Iterable[object] | None) -> list[str]:
    """Canonicalize and de-duplicate a skill collection."""
    if not values:
        return []
    return list(dict.fromkeys(filter(None, (normalize_skill(value) for value in values))))
