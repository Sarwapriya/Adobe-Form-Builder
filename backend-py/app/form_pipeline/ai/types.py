"""Port of packages/shared/src/ai/aiTypes.ts + aiTypesZod.ts.

Wire contract for the FabriXAI-backed Form Builder assistant. Ported as
Pydantic models: field/type shape mirrors aiTypes.ts, and the extra
constraints (`min_length`/`max_length`/UUID format/int bounds) mirror
aiTypesZod.ts's runtime `z.object(...)` checks — both TS files were
hand-kept in sync 1:1, so a single Pydantic model plays both roles here.
"""

from __future__ import annotations

from typing import Annotated, Literal, Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ..form.definition import LocaleCode, QuestionDefinition

AIToolName = Literal[
    "SEARCH_CAMPAIGNS",
    "GET_CAMPAIGN",
    "GET_CAMPAIGN_QUESTIONS",
    "SEARCH_QUESTIONS",
    "FIND_SIMILAR_CAMPAIGNS",
    "FIND_SIMILAR_QUESTIONS",
    "VALIDATE_FORM",
    "CREATE_CAMPAIGN",
    "CLONE_CAMPAIGN",
    "ADD_QUESTION",
    "UPDATE_QUESTION",
    "DELETE_QUESTION",
    "REORDER_QUESTIONS",
    "SUGGEST_QUESTIONS",
    "TRANSLATE_QUESTIONS",
]

# Tools that only read data — executed inline by aiAssistantService and never
# surfaced to the client as a pending action.
READ_ONLY_AI_TOOLS: tuple[AIToolName, ...] = (
    "SEARCH_CAMPAIGNS",
    "GET_CAMPAIGN",
    "GET_CAMPAIGN_QUESTIONS",
    "SEARCH_QUESTIONS",
    "FIND_SIMILAR_CAMPAIGNS",
    "FIND_SIMILAR_QUESTIONS",
    "VALIDATE_FORM",
)

# Tools that propose a change — always staged as a pending AIAction row, never
# executed until POST /ai/actions/:id/confirm.
MUTATING_AI_TOOLS: tuple[AIToolName, ...] = (
    "CREATE_CAMPAIGN",
    "CLONE_CAMPAIGN",
    "ADD_QUESTION",
    "UPDATE_QUESTION",
    "DELETE_QUESTION",
    "REORDER_QUESTIONS",
    "SUGGEST_QUESTIONS",
    "TRANSLATE_QUESTIONS",
)

# Of the mutating tools, the two with nothing to stage a draft edit into (the
# form doesn't exist yet) — confirm executes these server-side.
SERVER_EXECUTED_AI_TOOLS: tuple[AIToolName, ...] = ("CREATE_CAMPAIGN", "CLONE_CAMPAIGN")


def is_mutating_ai_tool(tool: AIToolName) -> bool:
    return tool in MUTATING_AI_TOOLS


def is_server_executed_ai_tool(tool: AIToolName) -> bool:
    return tool in SERVER_EXECUTED_AI_TOOLS


# ---- per-tool argument shapes ----


class _Model(BaseModel):
    model_config = ConfigDict(extra="ignore")


class SearchCampaignsArgs(_Model):
    searchText: Optional[str] = Field(default=None, min_length=1, max_length=200)
    projectCode: Optional[str] = Field(default=None, min_length=1, max_length=100)
    status: Optional[Literal["draft", "published", "unpublished"]] = None

    @field_validator("searchText", "projectCode", mode="before")
    @classmethod
    def _strip(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class GetCampaignArgs(_Model):
    formId: UUID


class GetCampaignQuestionsArgs(_Model):
    formId: UUID


class SearchQuestionsArgs(_Model):
    searchText: str = Field(min_length=1, max_length=200)
    formId: Optional[UUID] = None

    @field_validator("searchText", mode="before")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class FindSimilarCampaignsArgs(_Model):
    formId: UUID


class FindSimilarQuestionsArgs(_Model):
    formId: Optional[UUID] = None
    questionId: Optional[str] = None
    text: Optional[str] = Field(default=None, min_length=1, max_length=500)

    @field_validator("text", mode="before")
    @classmethod
    def _strip(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class ValidateFormArgs(_Model):
    formId: UUID


class CreateCampaignArgs(_Model):
    name: str = Field(min_length=1, max_length=200)
    subsidiaryId: str = Field(min_length=1)
    projectCode: Optional[str] = Field(default=None, min_length=1)

    @field_validator("name", "subsidiaryId", "projectCode", mode="before")
    @classmethod
    def _strip(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class CloneCampaignArgs(_Model):
    sourceFormId: UUID
    name: str = Field(min_length=1, max_length=200)
    subsidiaryId: str = Field(min_length=1)
    projectCode: Optional[str] = Field(default=None, min_length=1)

    @field_validator("name", "subsidiaryId", "projectCode", mode="before")
    @classmethod
    def _strip(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class AddQuestionArgs(_Model):
    question: QuestionDefinition


class UpdateQuestionArgs(_Model):
    questionId: str = Field(min_length=1)
    patch: dict = Field(default_factory=dict)


class DeleteQuestionArgs(_Model):
    questionId: str = Field(min_length=1)


class ReorderQuestionsArgs(_Model):
    orderedQuestionIds: list[str] = Field(min_length=1)


class SuggestQuestionsArgs(_Model):
    topic: str = Field(min_length=1, max_length=300)
    count: int = Field(ge=1, le=10)
    locale: Optional[LocaleCode] = None

    @field_validator("topic", mode="before")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class TranslateQuestionsArgs(_Model):
    questionIds: list[str] = Field(min_length=1)
    targetLocale: str = Field(min_length=1)


class SearchCampaignsCall(_Model):
    tool: Literal["SEARCH_CAMPAIGNS"] = "SEARCH_CAMPAIGNS"
    args: SearchCampaignsArgs


class GetCampaignCall(_Model):
    tool: Literal["GET_CAMPAIGN"] = "GET_CAMPAIGN"
    args: GetCampaignArgs


class GetCampaignQuestionsCall(_Model):
    tool: Literal["GET_CAMPAIGN_QUESTIONS"] = "GET_CAMPAIGN_QUESTIONS"
    args: GetCampaignQuestionsArgs


class SearchQuestionsCall(_Model):
    tool: Literal["SEARCH_QUESTIONS"] = "SEARCH_QUESTIONS"
    args: SearchQuestionsArgs


class FindSimilarCampaignsCall(_Model):
    tool: Literal["FIND_SIMILAR_CAMPAIGNS"] = "FIND_SIMILAR_CAMPAIGNS"
    args: FindSimilarCampaignsArgs


class FindSimilarQuestionsCall(_Model):
    tool: Literal["FIND_SIMILAR_QUESTIONS"] = "FIND_SIMILAR_QUESTIONS"
    args: FindSimilarQuestionsArgs


class ValidateFormCall(_Model):
    tool: Literal["VALIDATE_FORM"] = "VALIDATE_FORM"
    args: ValidateFormArgs


class CreateCampaignCall(_Model):
    tool: Literal["CREATE_CAMPAIGN"] = "CREATE_CAMPAIGN"
    args: CreateCampaignArgs


class CloneCampaignCall(_Model):
    tool: Literal["CLONE_CAMPAIGN"] = "CLONE_CAMPAIGN"
    args: CloneCampaignArgs


class AddQuestionCall(_Model):
    tool: Literal["ADD_QUESTION"] = "ADD_QUESTION"
    args: AddQuestionArgs


class UpdateQuestionCall(_Model):
    tool: Literal["UPDATE_QUESTION"] = "UPDATE_QUESTION"
    args: UpdateQuestionArgs


class DeleteQuestionCall(_Model):
    tool: Literal["DELETE_QUESTION"] = "DELETE_QUESTION"
    args: DeleteQuestionArgs


class ReorderQuestionsCall(_Model):
    tool: Literal["REORDER_QUESTIONS"] = "REORDER_QUESTIONS"
    args: ReorderQuestionsArgs


class SuggestQuestionsCall(_Model):
    tool: Literal["SUGGEST_QUESTIONS"] = "SUGGEST_QUESTIONS"
    args: SuggestQuestionsArgs


class TranslateQuestionsCall(_Model):
    tool: Literal["TRANSLATE_QUESTIONS"] = "TRANSLATE_QUESTIONS"
    args: TranslateQuestionsArgs


AIToolCall = Annotated[
    Union[
        SearchCampaignsCall,
        GetCampaignCall,
        GetCampaignQuestionsCall,
        SearchQuestionsCall,
        FindSimilarCampaignsCall,
        FindSimilarQuestionsCall,
        ValidateFormCall,
        CreateCampaignCall,
        CloneCampaignCall,
        AddQuestionCall,
        UpdateQuestionCall,
        DeleteQuestionCall,
        ReorderQuestionsCall,
        SuggestQuestionsCall,
        TranslateQuestionsCall,
    ],
    Field(discriminator="tool"),
]


# ---- chat request/response ----


class AIChatRequest(_Model):
    conversationId: Optional[UUID] = None
    formId: Optional[UUID] = None
    message: str = Field(min_length=1, max_length=4000)

    @field_validator("message", mode="before")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class AIActionSummary(_Model):
    id: str
    actionType: AIToolName
    # Whether the UI must show an extra "are you sure" step (destructive
    # types like DELETE_QUESTION) on top of the normal Add/Apply click.
    requiresConfirmation: bool
    data: object = None


class AICampaignReference(_Model):
    formId: str
    name: str
    status: str
    # "admin" (Form Initiator/HR) or "adhoc" (a subsidiary user's own submission).
    origin: Literal["admin", "adhoc"]
    questionCount: int
    locales: list[str]
    updatedAt: str


class AIChatResponse(_Model):
    conversationId: str
    message: str
    actions: list[AIActionSummary] = Field(default_factory=list)
    references: list[AICampaignReference] = Field(default_factory=list)


class AIConversationSummary(_Model):
    id: str
    formId: Optional[str] = None
    title: Optional[str] = None
    status: Literal["active", "archived"]
    createdAt: str
    updatedAt: str


class AIConversationMessageView(_Model):
    id: str
    role: Literal["user", "assistant", "system", "tool"]
    message: str
    createdAt: str


class AIConversationDetail(AIConversationSummary):
    messages: list[AIConversationMessageView] = Field(default_factory=list)


class AIConfirmActionResponse(_Model):
    actionId: str
    actionType: AIToolName
    executed: bool
    # Set only for server-executed tools (CREATE_CAMPAIGN/CLONE_CAMPAIGN).
    formId: Optional[str] = None
    # Echoes the action's payload back so a client-applied type can be handed
    # straight to the equivalent of useFormBuilderStore.updateDefinition.
    data: object = None
