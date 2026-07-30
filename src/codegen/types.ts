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
 * Builder-configurable generation options. Per product decision, `apiEndpoint` and
 * `analytics` default to blank/disabled — a generic tool must never hardcode a real
 * submission endpoint or tracking IDs, unlike the Samsung-specific reference.
 */
export interface BuilderConfig {
  variants: FormVariant[];
  apiEndpoint?: string;
  analytics?: AnalyticsConfig;
}

export function defaultBuilderConfig(): BuilderConfig {
  return { variants: ["ff"], apiEndpoint: "", analytics: { enabled: false } };
}
