"""Python port of packages/shared/src/ (the `@formbuilder/shared` TypeScript
package): the DOM-free FormDefinition data model, schema-authored validation,
contribution-merging, and codegen pipeline.

Mirrors packages/shared/src/index.ts as this package's public surface —
only symbols re-exported here are the stable contract other backend-py code
should import from `app.form_pipeline`; everything else under this package's
submodules is an internal implementation detail (mirroring the TS source's
own "only index.ts is the contract" convention).
"""

from __future__ import annotations

from .ai.types import (
    AIActionSummary,
    AIChatRequest,
    AIChatResponse,
    AIConfirmActionResponse,
    AIConversationDetail,
    AIConversationMessageView,
    AIConversationSummary,
    AICampaignReference,
    AIToolCall,
    AIToolName,
    MUTATING_AI_TOOLS,
    READ_ONLY_AI_TOOLS,
    SERVER_EXECUTED_AI_TOOLS,
    is_mutating_ai_tool,
    is_server_executed_ai_tool,
)
from .codegen.file_names import FileNames, resolve_file_names
from .codegen.generate import generate_solution
from .codegen.types import AnalyticsConfig, BuilderConfig, FormVariant, GeneratedFile, default_builder_config
from .excel.question_master_rows import QuestionMasterRow, build_question_master_rows
from .excel.question_master_workbook import build_question_master_workbook
from .excel.types import Issue, ParsedWorkbook, RawRow, ValidationResult, WorkbookMeta
from .form.calling_codes import CALLING_CODES, CallingCodeEntry, find_calling_code_entry
from .form.contribution import (
    ContributionContent,
    TranslationEntry,
    TranslationTarget,
    apply_contribution,
    target_key,
    validate_contribution,
)
from .form.definition import (
    AnswerDefinition,
    CallingCodeFieldMeta,
    ConsentDefinition,
    ConsentToggleMeta,
    ControlType,
    FormDefinition,
    LangSubtag,
    LocaleCode,
    LocaleInfo,
    LocalizedFieldMeta,
    MobileNumberFieldMeta,
    PageCopy,
    PrivacyPolicyMeta,
    ProfileFieldSet,
    QuestionDefinition,
    TermsAndConditionsMeta,
    ValidationMessageSet,
    resolve_localized_text,
    resolve_mobile_number_countries,
)
from .form.lang_names import RTL_LANGS, is_rtl_lang_subtag, lang_display_name
from .form.locale_migration import MigrateDefaultLocaleOptions, migrate_default_locale, remap_locales_for_copy
from .form.subsidiary_data import resolve_country_name, subsidiary_country_codes
from .form.validator import validate_form_definition

__all__ = [
    # excel/types
    "Issue",
    "ParsedWorkbook",
    "RawRow",
    "ValidationResult",
    "WorkbookMeta",
    # excel/question master
    "QuestionMasterRow",
    "build_question_master_rows",
    "build_question_master_workbook",
    # form/definition
    "AnswerDefinition",
    "CallingCodeFieldMeta",
    "ConsentDefinition",
    "ConsentToggleMeta",
    "ControlType",
    "FormDefinition",
    "LangSubtag",
    "LocaleCode",
    "LocaleInfo",
    "LocalizedFieldMeta",
    "MobileNumberFieldMeta",
    "PageCopy",
    "PrivacyPolicyMeta",
    "ProfileFieldSet",
    "QuestionDefinition",
    "TermsAndConditionsMeta",
    "ValidationMessageSet",
    "resolve_localized_text",
    "resolve_mobile_number_countries",
    "migrate_default_locale",
    "remap_locales_for_copy",
    "MigrateDefaultLocaleOptions",
    # form/validator
    "validate_form_definition",
    # form/contribution
    "apply_contribution",
    "validate_contribution",
    "target_key",
    "ContributionContent",
    "TranslationEntry",
    "TranslationTarget",
    # form/calling_codes + subsidiary_data
    "CALLING_CODES",
    "CallingCodeEntry",
    "find_calling_code_entry",
    "resolve_country_name",
    "subsidiary_country_codes",
    # form/lang_names
    "is_rtl_lang_subtag",
    "lang_display_name",
    "RTL_LANGS",
    # ai/types
    "READ_ONLY_AI_TOOLS",
    "MUTATING_AI_TOOLS",
    "SERVER_EXECUTED_AI_TOOLS",
    "is_mutating_ai_tool",
    "is_server_executed_ai_tool",
    "AIToolName",
    "AIToolCall",
    "AIChatRequest",
    "AIActionSummary",
    "AICampaignReference",
    "AIChatResponse",
    "AIConversationSummary",
    "AIConversationMessageView",
    "AIConversationDetail",
    "AIConfirmActionResponse",
    # codegen
    "generate_solution",
    "default_builder_config",
    "AnalyticsConfig",
    "BuilderConfig",
    "FormVariant",
    "GeneratedFile",
    "resolve_file_names",
    "FileNames",
]
