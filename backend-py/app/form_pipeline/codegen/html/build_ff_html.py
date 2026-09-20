"""Port of packages/shared/src/codegen/html/buildFfHtml.ts."""

from __future__ import annotations

from typing import Optional

from ...form.definition import FormDefinition
from ..file_names import FileNames, language_file_names
from ..types import BuilderConfig, GeneratedFile
from .page_template import render_page


def build_ff_html(
    form: FormDefinition, config: BuilderConfig, file_names: FileNames, locale: Optional[str] = None
) -> GeneratedFile:
    """The Full Form page for one language (the form's default language when `locale` is omitted)."""
    return GeneratedFile(
        path=language_file_names(file_names, locale).ffHtml,
        contents=render_page(form, config, "ff", file_names, locale),
    )
