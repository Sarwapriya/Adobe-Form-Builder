"""One-time repair for a historical gap between `fq.GeneratedFiles` rows and
the `UPLOAD_DIR` volume: some older published forms' rows survived (the
database is a separate SQL Server, unaffected) while their on-disk output
was lost at some point before this script existed (e.g. a container
recreation that didn't have the uploads volume mounted the same way).
Confirmed via investigation: the newest published form's files were intact,
every older one's were missing — see the Edit Files 500s this surfaced.

The actual content is never lost — it's 100% deterministic from the
FormVersion's own stored `definition`/`config` (the same two fields
publish_form itself used to produce it originally), so this just re-runs
codegen for every FormVersion that has at least one missing file and writes
the missing ones back to the exact path their DB row already records. It
never creates new GeneratedFile rows, never bumps a version number, never
triggers SFTP deploy or email, and never touches a file that's still
present on disk — in particular, a missing file whose row has `editedAt`
set (a prior hand-edit) is reported but *not* silently overwritten with
plain regenerated content, since that specific edit's content can't be
recovered and regenerating it would silently discard the fact that it was
ever customized.

Idempotent / safe to re-run — only touches rows whose on-disk file is still
missing at the time it runs.

    python scripts/repair_missing_generated_files.py [--dry-run]
"""

from __future__ import annotations

import sys

sys.path.insert(0, ".")

import argparse
import os
from collections import defaultdict

from sqlalchemy import select

from app.db import get_sessionmaker
from app.form_pipeline import BuilderConfig, FormDefinition, generate_solution
from app.models.form_version import FormVersion
from app.models.generated_file import GeneratedFile as GeneratedFileEntity
from app.services.file_service import absolute_file_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Report what would be repaired without writing anything.")
    args = parser.parse_args()

    db = get_sessionmaker()()
    try:
        rows = list(db.execute(select(GeneratedFileEntity)).scalars())
        missing_by_version: dict[str, list[GeneratedFileEntity]] = defaultdict(list)
        for row in rows:
            if not os.path.exists(absolute_file_path(row.filePath)):
                missing_by_version[row.formVersionId].append(row)

        if not missing_by_version:
            print("Nothing missing — every GeneratedFile row's on-disk file is present.")
            return

        total_missing = sum(len(v) for v in missing_by_version.values())
        print(f"{total_missing} missing file(s) across {len(missing_by_version)} form version(s).")

        repaired = 0
        hand_edited_unrecoverable = 0
        for version_id, missing_rows in missing_by_version.items():
            version = db.get(FormVersion, version_id)
            if version is None:
                print(f"  SKIP formVersionId={version_id}: FormVersion row no longer exists")
                continue

            edited = [r for r in missing_rows if r.editedAt is not None]
            if edited:
                hand_edited_unrecoverable += len(edited)
                print(
                    f"  WARN formVersionId={version_id}: {len(edited)} missing file(s) were hand-edited — "
                    f"that specific edit cannot be recovered, only plain regenerated output: "
                    + ", ".join(r.fileName for r in edited)
                )

            definition = FormDefinition.model_validate_json(version.definition)
            config = BuilderConfig.model_validate_json(version.config)
            generated_by_name = {f.path: f for f in generate_solution(definition, config)}

            for row in missing_rows:
                generated = generated_by_name.get(row.fileName)
                if generated is None:
                    print(f"  SKIP {row.filePath}: codegen no longer produces a file by this name")
                    continue
                target = absolute_file_path(row.filePath)
                print(f"  {'[dry-run] would write' if args.dry_run else 'writing'} {row.filePath}")
                if not args.dry_run:
                    os.makedirs(os.path.dirname(target), exist_ok=True)
                    with open(target, "w", encoding="utf-8", newline="") as fh:
                        fh.write(generated.contents)
                    repaired += 1

        if args.dry_run:
            print(f"Dry run — would repair {total_missing} file(s) listed above.")
        else:
            print(f"Repaired {repaired} file(s). {hand_edited_unrecoverable} hand-edited file(s) restored as plain regenerated output only.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
