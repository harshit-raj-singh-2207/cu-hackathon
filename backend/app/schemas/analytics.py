"""Response envelopes for placement analytics endpoints."""

from typing import Any

from pydantic import RootModel


class PlacementAnalyticsResponse(RootModel[dict[str, Any]]):
    pass


class ReadinessResponse(RootModel[dict[str, Any]]):
    pass


class SkillGapResponse(RootModel[dict[str, Any]]):
    pass


class DashboardEnvelope(RootModel[dict[str, Any]]):
    pass


class Suggestion(RootModel[dict[str, Any]]):
    pass
