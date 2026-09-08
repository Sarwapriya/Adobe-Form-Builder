"""Port of packages/shared/src/codegen/html/buildOcHtml.ts."""

from __future__ import annotations

from ...form.definition import FormDefinition
from ..file_names import FileNames
from ..types import BuilderConfig, GeneratedFile
from .page_template import render_page


def build_oc_html(form: FormDefinition, config: BuilderConfig, file_names: FileNames) -> GeneratedFile:
    return GeneratedFile(path=file_names.ocHtml, contents=render_page(form, config, "oc", file_names))
