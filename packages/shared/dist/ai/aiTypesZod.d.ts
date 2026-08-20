/**
 * Zod schema mirroring aiTypes.ts 1:1, hand-kept in sync (no z.infer
 * codegen — same convention as formDefinitionZod.ts). Every tool-call JSON
 * the model produces is validated against `aiToolCallSchema` before
 * aiAssistantService ever executes a read-only tool or stages a mutating
 * one as a pending AIAction — a malformed or hostile model response can't
 * reach a form.
 */
import { z } from "zod";
export declare const searchCampaignsArgsSchema: z.ZodObject<{
    searchText: z.ZodOptional<z.ZodString>;
    projectCode: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        draft: "draft";
        published: "published";
        unpublished: "unpublished";
    }>>;
}, z.core.$strip>;
export declare const getCampaignArgsSchema: z.ZodObject<{
    formId: z.ZodString;
}, z.core.$strip>;
export declare const getCampaignQuestionsArgsSchema: z.ZodObject<{
    formId: z.ZodString;
}, z.core.$strip>;
export declare const searchQuestionsArgsSchema: z.ZodObject<{
    searchText: z.ZodString;
    formId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const findSimilarCampaignsArgsSchema: z.ZodObject<{
    formId: z.ZodString;
}, z.core.$strip>;
export declare const findSimilarQuestionsArgsSchema: z.ZodObject<{
    formId: z.ZodOptional<z.ZodString>;
    questionId: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const validateFormArgsSchema: z.ZodObject<{
    formId: z.ZodString;
}, z.core.$strip>;
export declare const createCampaignArgsSchema: z.ZodObject<{
    name: z.ZodString;
    subsidiaryId: z.ZodString;
    projectCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const cloneCampaignArgsSchema: z.ZodObject<{
    sourceFormId: z.ZodString;
    name: z.ZodString;
    subsidiaryId: z.ZodString;
    projectCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const addQuestionArgsSchema: z.ZodObject<{
    question: z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        controlType: z.ZodEnum<{
            radio: "radio";
            checkbox: "checkbox";
            text: "text";
            shortText: "shortText";
            dropdown: "dropdown";
        }>;
        headingByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        subheadingByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        required: z.ZodBoolean;
        answers: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            textByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            image: z.ZodOptional<z.ZodObject<{
                src: z.ZodString;
                alt: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        visibleInVariants: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            ff: "ff";
            oc: "oc";
        }>>>;
        autoPopulateEligible: z.ZodOptional<z.ZodBoolean>;
        autoPopulateEnabled: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateQuestionArgsSchema: z.ZodObject<{
    questionId: z.ZodString;
    patch: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        order: z.ZodOptional<z.ZodNumber>;
        controlType: z.ZodOptional<z.ZodEnum<{
            radio: "radio";
            checkbox: "checkbox";
            text: "text";
            shortText: "shortText";
            dropdown: "dropdown";
        }>>;
        headingByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        subheadingByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        required: z.ZodOptional<z.ZodBoolean>;
        answers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            textByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            image: z.ZodOptional<z.ZodObject<{
                src: z.ZodString;
                alt: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>>>;
        visibleInVariants: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodEnum<{
            ff: "ff";
            oc: "oc";
        }>>>>;
        autoPopulateEligible: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        autoPopulateEnabled: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const deleteQuestionArgsSchema: z.ZodObject<{
    questionId: z.ZodString;
}, z.core.$strip>;
export declare const reorderQuestionsArgsSchema: z.ZodObject<{
    orderedQuestionIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const suggestQuestionsArgsSchema: z.ZodObject<{
    topic: z.ZodString;
    count: z.ZodNumber;
    locale: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const translateQuestionsArgsSchema: z.ZodObject<{
    questionIds: z.ZodArray<z.ZodString>;
    targetLocale: z.ZodString;
}, z.core.$strip>;
export declare const aiToolCallSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    tool: z.ZodLiteral<"SEARCH_CAMPAIGNS">;
    args: z.ZodObject<{
        searchText: z.ZodOptional<z.ZodString>;
        projectCode: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            draft: "draft";
            published: "published";
            unpublished: "unpublished";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"GET_CAMPAIGN">;
    args: z.ZodObject<{
        formId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"GET_CAMPAIGN_QUESTIONS">;
    args: z.ZodObject<{
        formId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"SEARCH_QUESTIONS">;
    args: z.ZodObject<{
        searchText: z.ZodString;
        formId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"FIND_SIMILAR_CAMPAIGNS">;
    args: z.ZodObject<{
        formId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"FIND_SIMILAR_QUESTIONS">;
    args: z.ZodObject<{
        formId: z.ZodOptional<z.ZodString>;
        questionId: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"VALIDATE_FORM">;
    args: z.ZodObject<{
        formId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"CREATE_CAMPAIGN">;
    args: z.ZodObject<{
        name: z.ZodString;
        subsidiaryId: z.ZodString;
        projectCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"CLONE_CAMPAIGN">;
    args: z.ZodObject<{
        sourceFormId: z.ZodString;
        name: z.ZodString;
        subsidiaryId: z.ZodString;
        projectCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"ADD_QUESTION">;
    args: z.ZodObject<{
        question: z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            controlType: z.ZodEnum<{
                radio: "radio";
                checkbox: "checkbox";
                text: "text";
                shortText: "shortText";
                dropdown: "dropdown";
            }>;
            headingByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            subheadingByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            required: z.ZodBoolean;
            answers: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                order: z.ZodNumber;
                textByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
                image: z.ZodOptional<z.ZodObject<{
                    src: z.ZodString;
                    alt: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
            visibleInVariants: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                ff: "ff";
                oc: "oc";
            }>>>;
            autoPopulateEligible: z.ZodOptional<z.ZodBoolean>;
            autoPopulateEnabled: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"UPDATE_QUESTION">;
    args: z.ZodObject<{
        questionId: z.ZodString;
        patch: z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            order: z.ZodOptional<z.ZodNumber>;
            controlType: z.ZodOptional<z.ZodEnum<{
                radio: "radio";
                checkbox: "checkbox";
                text: "text";
                shortText: "shortText";
                dropdown: "dropdown";
            }>>;
            headingByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            subheadingByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            required: z.ZodOptional<z.ZodBoolean>;
            answers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                order: z.ZodNumber;
                textByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
                image: z.ZodOptional<z.ZodObject<{
                    src: z.ZodString;
                    alt: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>>;
            }, z.core.$strip>>>;
            visibleInVariants: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodEnum<{
                ff: "ff";
                oc: "oc";
            }>>>>;
            autoPopulateEligible: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
            autoPopulateEnabled: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"DELETE_QUESTION">;
    args: z.ZodObject<{
        questionId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"REORDER_QUESTIONS">;
    args: z.ZodObject<{
        orderedQuestionIds: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"SUGGEST_QUESTIONS">;
    args: z.ZodObject<{
        topic: z.ZodString;
        count: z.ZodNumber;
        locale: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    tool: z.ZodLiteral<"TRANSLATE_QUESTIONS">;
    args: z.ZodObject<{
        questionIds: z.ZodArray<z.ZodString>;
        targetLocale: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>], "tool">;
export declare const aiChatRequestSchema: z.ZodObject<{
    conversationId: z.ZodOptional<z.ZodString>;
    formId: z.ZodOptional<z.ZodString>;
    message: z.ZodString;
}, z.core.$strip>;
