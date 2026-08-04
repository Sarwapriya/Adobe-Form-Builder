/** Reads a required environment variable, throwing a clear error if it's unset —
 * used for secrets/config that must be present for the server to function
 * correctly (e.g. JWT_SECRET), so a misconfiguration fails loudly at first use
 * rather than silently producing undefined behavior. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}
