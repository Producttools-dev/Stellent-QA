/** App base URL used to build the VPS callback target. */
export function appUrl(): string {
  return (process.env["NEXT_PUBLIC_APP_URL"] ?? "https://qa.stellent.ai").replace(/\/$/, "");
}
