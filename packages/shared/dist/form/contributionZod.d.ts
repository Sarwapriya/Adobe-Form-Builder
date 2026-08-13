/**
 * Zod schema mirroring `contribution.ts` 1:1, hand-kept in sync (no z.infer codegen) —
 * same convention as formDefinitionZod.ts. This is what the backend actually validates
 * a submitted contribution against at the API boundary.
 */
import { z } from "zod";
export declare const translationTargetSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    kind: z.ZodLiteral<"profileLabel">;
    field: z.ZodEnum<{
        email: "email";
        firstName: "firstName";
        lastName: "lastName";
        marketingOptin: "marketingOptin";
        mobileNumber: "mobileNumber";
    }>;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"privacyPolicyText">;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"privacyPolicyLink">;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"consentText">;
    consentId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"consentLink">;
    consentId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"questionHeading">;
    questionId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"questionSubheading">;
    questionId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"answerText">;
    questionId: z.ZodString;
    answerId: z.ZodString;
}, z.core.$strip>], "kind">;
export declare const translationEntrySchema: z.ZodObject<{
    target: z.ZodDiscriminatedUnion<[z.ZodObject<{
        kind: z.ZodLiteral<"profileLabel">;
        field: z.ZodEnum<{
            email: "email";
            firstName: "firstName";
            lastName: "lastName";
            marketingOptin: "marketingOptin";
            mobileNumber: "mobileNumber";
        }>;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"privacyPolicyText">;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"privacyPolicyLink">;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"consentText">;
        consentId: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"consentLink">;
        consentId: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"questionHeading">;
        questionId: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"questionSubheading">;
        questionId: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"answerText">;
        questionId: z.ZodString;
        answerId: z.ZodString;
    }, z.core.$strip>], "kind">;
    locale: z.ZodString;
    value: z.ZodString;
}, z.core.$strip>;
export declare const contributionContentSchema: z.ZodObject<{
    translations: z.ZodArray<z.ZodObject<{
        target: z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"profileLabel">;
            field: z.ZodEnum<{
                email: "email";
                firstName: "firstName";
                lastName: "lastName";
                marketingOptin: "marketingOptin";
                mobileNumber: "mobileNumber";
            }>;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"privacyPolicyText">;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"privacyPolicyLink">;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"consentText">;
            consentId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"consentLink">;
            consentId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"questionHeading">;
            questionId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"questionSubheading">;
            questionId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"answerText">;
            questionId: z.ZodString;
            answerId: z.ZodString;
        }, z.core.$strip>], "kind">;
        locale: z.ZodString;
        value: z.ZodString;
    }, z.core.$strip>>;
    newQuestions: z.ZodArray<z.ZodObject<{
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
    }, z.core.$strip>>;
    newConsents: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        textByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        linkUrlByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        required: z.ZodOptional<z.ZodBoolean>;
        visibleInVariants: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            ff: "ff";
            oc: "oc";
        }>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
