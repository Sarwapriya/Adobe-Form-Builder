import { apiClient } from "./apiClient";
import type { SubsidiaryCountry } from "./subsidiariesApi";

/** GET /api/v1/subsidiaries/countries — every active country, for the admin
 * country-assignment multi-select. Any authenticated user (harmless to
 * expose — flags/names aren't sensitive); full CRUD including inactive ones
 * lives in adminApi.ts's listAllCountries/createCountry/setCountryActive. */
export function listCountries(): Promise<SubsidiaryCountry[]> {
  return apiClient.get<SubsidiaryCountry[]>("/api/v1/subsidiaries/countries");
}
