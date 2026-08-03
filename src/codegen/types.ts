export interface GeneratedFile {
  path: string;
  contents: string;
}

export type FormVariant = "ff" | "oc";

export interface AnalyticsConfig {
  enabled: boolean;
  reportSuiteID?: string;
  imsOrgID?: string;
  datastreamID?: string;
}

/**
 * Builder-configurable generation options. Per product decision, `apiEndpoint`,
 * `analytics`, `faviconUrl`, and `customFontsHref` all default to blank/disabled — a
 * generic tool must never hardcode a real submission endpoint, tracking IDs, or a
 * specific brand's favicon/font assets, unlike the Samsung-specific reference.
 */
export interface BuilderConfig {
  variants: FormVariant[];
  apiEndpoint?: string;
  analytics?: AnalyticsConfig;
  /** Overrides the derived `{subsidiary}-{LANG}` output file name prefix (see fileNames.ts). */
  fileNamePrefix?: string;
  /** URL/path for a `<link rel="shortcut icon">` tag; omitted from <head> when blank. */
  faviconUrl?: string;
  /** URL/path for an additional `<link rel="stylesheet">` (e.g. a custom font sheet); omitted when blank. */
  customFontsHref?: string;
  /** Submission-tracking identifiers threaded into the generated FF/OC scripts' API
   * request payload (`mapParam`, part of the byte-identical reference script), mirroring
   * the reference's top-level `param` object. Each has no generic default — a real value
   * must be entered by the builder user for the submitted payload to carry meaningful
   * tracking data. */
  project?: string;
  channel?: { fullForm?: string; oneClick?: string };
  channelDetail?: { fullForm?: string; oneClick?: string };
  source?: { fullForm?: string; oneClick?: string };
  voucherRequired?: "Y" | "N";
  /** Per-question required override: questionId → true/false. Undefined keeps the
   * default (true). Used to make a question optional in the generated form. */
  questionRequired?: Record<string, boolean>;
}

export function defaultBuilderConfig(): BuilderConfig {
  return {
    variants: ["ff"],
    apiEndpoint: "",
    analytics: { enabled: false },
    fileNamePrefix: "",
    faviconUrl: "",
    customFontsHref: "",
    project: "",
    channel: { fullForm: "", oneClick: "" },
    channelDetail: { fullForm: "", oneClick: "" },
    source: { fullForm: "", oneClick: "" },
    voucherRequired: "N",
  };
}
