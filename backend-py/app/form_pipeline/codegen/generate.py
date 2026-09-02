"""Port of packages/shared/src/codegen/generate.ts.

Pure function: `FormDefinition` + `BuilderConfig` in, generated files out. No
filesystem/download side effects live here — this is what a live preview and
the "Generate Form" action both call, so they can never drift.

Output mirrors the reference's file count (no invented extras): one HTML
file and one behavior JS file per requested variant, one shared `data.js`,
one `style.css` — for *every* locale the form has, not just the default one.
"""

from __future__ import annotations

from ..form.definition import FormDefinition
from .build_data_js import build_data_js
from .build_ff_js import build_ff_js
from .build_oc_js import build_oc_js
from .build_style_css import build_style_css
from .file_names import resolve_file_names
from .html.build_ff_html import build_ff_html
from .html.build_oc_html import build_oc_html
from .types import BuilderConfig, GeneratedFile


def generate_solution(form: FormDefinition, config: BuilderConfig) -> list[GeneratedFile]:
    file_names = resolve_file_names(form, config)

    # Apply per-question required overrides from config.
    if config.questionRequired:
        effective_form = form.model_copy(deep=True)
        for q in effective_form.questions:
            override = config.questionRequired.get(q.id)
            if override is not None:
                q.required = override
    else:
        effective_form = form

    files: list[GeneratedFile] = []
    if "ff" in config.variants:
        files.append(build_ff_html(effective_form, config, file_names))
        files.append(build_ff_js(file_names))
    if "oc" in config.variants:
        files.append(build_oc_html(effective_form, config, file_names))
        files.append(build_oc_js(file_names))
    files.append(build_data_js(effective_form, config, file_names))
    files.append(build_style_css(file_names))

    return files
