"""Port of packages/shared/src/codegen/types.ts."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from ..form.definition import FormVariant

__all__ = ["FormVariant", "AnalyticsConfig", "BuilderConfig", "GeneratedFile", "default_builder_config"]


class GeneratedFile(BaseModel):
    path: str
    contents: str


class AnalyticsConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    enabled: bool
    reportSuiteID: Optional[str] = None
    imsOrgID: Optional[str] = None
    datastreamID: Optional[str] = None


class ChannelConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    fullForm: Optional[str] = None
    oneClick: Optional[str] = None


class BuilderConfig(BaseModel):
    """Builder-configurable generation options. Per product decision,
    `apiEndpoint`, `analytics`, `faviconUrl`, and `customFontsHref` all default
    to blank/disabled — a generic tool must never hardcode a real submission
    endpoint, tracking IDs, or a specific brand's favicon/font assets, unlike
    the Samsung-specific reference."""

    model_config = ConfigDict(extra="ignore")

    variants: list[FormVariant] = Field(default_factory=lambda: ["ff"])
    apiEndpoint: Optional[str] = None
    analytics: Optional[AnalyticsConfig] = None
    # Overrides the derived `{subsidiary}-{LANG}` output file name prefix.
    fileNamePrefix: Optional[str] = None
    faviconUrl: Optional[str] = None
    customFontsHref: Optional[str] = None
    project: Optional[str] = None
    channel: Optional[ChannelConfig] = None
    channelDetail: Optional[ChannelConfig] = None
    source: Optional[ChannelConfig] = None
    voucherRequired: Optional[Literal["Y", "N"]] = None
    # Per-question required override: questionId -> true/false.
    questionRequired: Optional[dict[str, bool]] = None


def default_builder_config() -> BuilderConfig:
    return BuilderConfig(
        variants=["ff"],
        apiEndpoint="",
        analytics=AnalyticsConfig(enabled=False),
        fileNamePrefix="",
        faviconUrl="",
        customFontsHref="",
        project="",
        channel=ChannelConfig(fullForm="", oneClick=""),
        channelDetail=ChannelConfig(fullForm="", oneClick=""),
        source=ChannelConfig(fullForm="", oneClick=""),
        voucherRequired="N",
    )
