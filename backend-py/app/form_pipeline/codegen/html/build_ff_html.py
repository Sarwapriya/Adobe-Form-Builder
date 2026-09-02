"""Port of packages/shared/src/codegen/html/buildFfHtml.ts."""

from __future__ import annotations

from ...form.definition import FormDefinition
from ..file_names import FileNames
from ..types import BuilderConfig, GeneratedFile
from .page_template import render_page


def build_ff_html(form: FormDefinition, config: BuilderConfig, file_names: FileNames) -> GeneratedFile:
    return GeneratedFile(path=file_names.ffHtml, contents=render_page(form, config, "ff", file_names))
