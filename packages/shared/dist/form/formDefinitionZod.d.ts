/**
 * Zod schema mirroring `formDefinition.ts` 1:1, hand-kept in sync (no z.infer codegen).
 * A change to one file needs a matching edit in the other.
 */
import { z } from "zod";
export declare const controlTypeSchema: z.ZodEnum<{
    radio: "radio";
    checkbox: "checkbox";
    text: "text";
}>;
export declare const localeInfoSchema: z.ZodObject<{
    code: z.ZodString;
    langSubtag: z.ZodString;
    isRtl: z.ZodBoolean;
    sourceColumn: z.ZodEnum<{
        en_GB: "en_GB";
        C: "C";
        D: "D";
    }>;
    label: z.ZodString;
}, z.core.$strip>;
export declare const answerDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    textByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
    image: z.ZodOptional<z.ZodObject<{
        src: z.ZodString;
        alt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const questionDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    controlType: z.ZodEnum<{
        radio: "radio";
        checkbox: "checkbox";
        text: "text";
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
}, z.core.$strip>;
export declare const profileFieldSetSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodObject<{
        labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    firstName: z.ZodOptional<z.ZodObject<{
        labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    lastName: z.ZodOptional<z.ZodObject<{
        labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    countryCode: z.ZodOptional<z.ZodObject<{
        labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    callingCode: z.ZodOptional<z.ZodObject<{
        labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        dropdownFirstEntryByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
    }, z.core.$strip>>;
    privacyPolicy: z.ZodOptional<z.ZodObject<{
        textByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        linkUrlByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
    }, z.core.$strip>>;
    marketingOptin: z.ZodOptional<z.ZodObject<{
        labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    termsAndConditions: z.ZodOptional<z.ZodObject<{
        textByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        urlByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
    }, z.core.$strip>>;
    submitButton: z.ZodObject<{
        labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>;
    redirectAfterSuccessUrlByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    headingBeforeBreakByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    headingAfterBreakByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    requiredFieldNoteByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    extraFieldsByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>>;
}, z.core.$strip>;
export declare const pageCopySchema: z.ZodObject<{
    heading: z.ZodOptional<z.ZodString>;
    subHeading: z.ZodOptional<z.ZodString>;
    subHeadingUrlText: z.ZodOptional<z.ZodString>;
    subHeadingUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const validationMessageSetSchema: z.ZodObject<{
    requiredField: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    mobileNumber: z.ZodOptional<z.ZodString>;
    modalMessage1: z.ZodOptional<z.ZodString>;
    modalMessage2: z.ZodOptional<z.ZodString>;
    modalButtonYes: z.ZodOptional<z.ZodString>;
    modalButtonNo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const formDefinitionSchema: z.ZodObject<{
    meta: z.ZodObject<{
        subsidiary: z.ZodString;
        sourceFileName: z.ZodString;
        defaultLocale: z.ZodString;
    }, z.core.$strip>;
    locales: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        langSubtag: z.ZodString;
        isRtl: z.ZodBoolean;
        sourceColumn: z.ZodEnum<{
            en_GB: "en_GB";
            C: "C";
            D: "D";
        }>;
        label: z.ZodString;
    }, z.core.$strip>>;
    questions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        controlType: z.ZodEnum<{
            radio: "radio";
            checkbox: "checkbox";
            text: "text";
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
    }, z.core.$strip>>;
    fields: z.ZodObject<{
        email: z.ZodOptional<z.ZodObject<{
            labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>;
        firstName: z.ZodOptional<z.ZodObject<{
            labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>;
        lastName: z.ZodOptional<z.ZodObject<{
            labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>;
        countryCode: z.ZodOptional<z.ZodObject<{
            labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>;
        callingCode: z.ZodOptional<z.ZodObject<{
            labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            dropdownFirstEntryByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        }, z.core.$strip>>;
        privacyPolicy: z.ZodOptional<z.ZodObject<{
            textByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            linkUrlByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        }, z.core.$strip>>;
        marketingOptin: z.ZodOptional<z.ZodObject<{
            labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>;
        termsAndConditions: z.ZodOptional<z.ZodObject<{
            textByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            urlByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
        }, z.core.$strip>>;
        submitButton: z.ZodObject<{
            labelByLocale: z.ZodRecord<z.ZodString, z.ZodString>;
            placeholderByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>;
        redirectAfterSuccessUrlByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        headingBeforeBreakByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        headingAfterBreakByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        requiredFieldNoteByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        extraFieldsByLocale: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>>;
    }, z.core.$strip>;
    validationMessages: z.ZodRecord<z.ZodString, z.ZodObject<{
        requiredField: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        mobileNumber: z.ZodOptional<z.ZodString>;
        modalMessage1: z.ZodOptional<z.ZodString>;
        modalMessage2: z.ZodOptional<z.ZodString>;
        modalButtonYes: z.ZodOptional<z.ZodString>;
        modalButtonNo: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    pageError: z.ZodRecord<z.ZodString, z.ZodObject<{
        heading: z.ZodOptional<z.ZodString>;
        subHeading: z.ZodOptional<z.ZodString>;
        subHeadingUrlText: z.ZodOptional<z.ZodString>;
        subHeadingUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    thankYou: z.ZodRecord<z.ZodString, z.ZodObject<{
        heading: z.ZodOptional<z.ZodString>;
        subHeading: z.ZodOptional<z.ZodString>;
        subHeadingUrlText: z.ZodOptional<z.ZodString>;
        subHeadingUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
