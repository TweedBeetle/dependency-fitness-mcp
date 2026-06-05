/**
 * OSV.dev client (Google) — security advisories + malicious-package (MAL-*)
 * markers. Folds "is this version withdrawn for security / is it malware" into
 * the verdict, and supplies advisory "fixed in" versions used to bound a safe
 * upgrade target. Free, no key.
 */

const OSV_QUERY = process.env.DEPCHECK_OSV || "https://api.osv.dev/v1/query";

export interface OsvVuln {
  id: string;
  summary: string;
  severity: string | null;
  fixed: string[];
  malicious: boolean;
}

export interface OsvResult {
  ok: boolean;
  vulns: OsvVuln[];
}

export async function fetchOsv(
  name: string,
  version: string | null,
  signal?: AbortSignal,
): Promise<OsvResult> {
  const body: Record<string, any> = { package: { ecosystem: "npm", name } };
  if (version) body.version = version;
  const res = await fetch(OSV_QUERY, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) return { ok: false, vulns: [] };
  const d = (await res.json()) as Record<string, any>;
  const vulns: OsvVuln[] = (d.vulns || []).map((v: any): OsvVuln => {
    const fixed: string[] = [];
    for (const aff of v.affected || []) {
      for (const r of aff.ranges || []) {
        for (const e of r.events || []) {
          if (typeof e.fixed === "string") fixed.push(e.fixed);
        }
      }
    }
    const id: string = typeof v.id === "string" ? v.id : "(unknown)";
    const severity: string | null =
      v.database_specific?.severity ||
      (Array.isArray(v.severity) && v.severity[0]?.score) ||
      null;
    const summary: string =
      v.summary || (typeof v.details === "string" ? v.details.slice(0, 200) : "(no summary)");
    return {
      id,
      summary,
      severity,
      fixed: [...new Set(fixed)],
      malicious: id.startsWith("MAL-"),
    };
  });
  return { ok: true, vulns };
}
