"""All SQLAlchemy models — importing this module registers every table on
`Base.metadata` (needed for Alembic autogenerate / `create_all` in tests).

Mirrors the entity list in `backend/src/config/data-source.ts`'s
`AppDataSource` `entities` array exactly (20 entities).
"""

from app.models.base import Base
from app.models.admin_setting import AdminSetting
from app.models.user import User, UserRole, is_admin_role
from app.models.refresh_token import RefreshToken
from app.models.generated_file import GeneratedFile
from app.models.email_log import EmailLog
from app.models.project_code import ProjectCode
from app.models.subsidiary import Subsidiary
from app.models.subsidiary_project_block import SubsidiaryProjectBlock
from app.models.subsidiary_locale import SubsidiaryLocale
from app.models.qa_run import QaRun
from app.models.qa_test_case_result import QaTestCaseResult
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.form_contribution import FormContribution
from app.models.question_master_version import QuestionMasterVersion
from app.models.ai_conversation import AIConversation
from app.models.ai_conversation_message import AIConversationMessage
from app.models.ai_action import AIAction
from app.models.fabrix_model import FabrixModel
from app.models.other_ai_model import OtherAiModel

__all__ = [
    "Base",
    "AdminSetting",
    "User",
    "UserRole",
    "is_admin_role",
    "RefreshToken",
    "GeneratedFile",
    "EmailLog",
    "ProjectCode",
    "Subsidiary",
    "SubsidiaryProjectBlock",
    "SubsidiaryLocale",
    "QaRun",
    "QaTestCaseResult",
    "Form",
    "FormVersion",
    "FormContribution",
    "QuestionMasterVersion",
    "AIConversation",
    "AIConversationMessage",
    "AIAction",
    "FabrixModel",
    "OtherAiModel",
]
