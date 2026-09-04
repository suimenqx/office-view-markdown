/**
 * PlantUML Server Base URL helpers.
 * No auth headers/credentials — only servers reachable without auth.
 */

/** Minimal diagram used by Server Connectivity Test (pre-encoded with plantuml-encoder). */
export const PLANTUML_TEST_DIAGRAM = '@startuml\nA -> B\n@enduml';

/** plantuml-encoder.encode(PLANTUML_TEST_DIAGRAM) */
export const PLANTUML_TEST_ENCODED = 'UDfpA2v9B2efpStXSbJGjLDmud98pKi1SW5Y-WV4';

export const PLANTUML_SERVER_SETTING_KEY = 'office-view-markdown.plantuml.server';

export function normalizePlantumlServerBase(base: string | undefined | null): string {
    if (!base) {
        return '';
    }
    return base.trim().replace(/\/+$/, '');
}

export function isPlantumlServerConfigured(base: string | undefined | null): boolean {
    return normalizePlantumlServerBase(base).length > 0;
}

/**
 * Build a PlantUML SVG render URL from a Base URL and an already-encoded diagram payload.
 * - trim, strip trailing `/`
 * - if base ends with `/svg` or `/png`, append `/~1{encoded}`
 * - else append `/svg/~1{encoded}`
 */
export function buildPlantumlRenderUrl(base: string, encoded: string): string {
    const normalized = normalizePlantumlServerBase(base);
    if (!normalized) {
        throw new Error('PlantUML Server Base URL is not configured');
    }
    const payload = `/~1${encoded}`;
    if (/\/(svg|png)$/i.test(normalized)) {
        return `${normalized}${payload}`;
    }
    return `${normalized}/svg${payload}`;
}

export function buildPlantumlTestUrl(base: string): string {
    return buildPlantumlRenderUrl(base, PLANTUML_TEST_ENCODED);
}

export function looksLikePlantumlImage(contentType: string | null, bodyText: string): boolean {
    const type = (contentType || '').toLowerCase();
    if (type.startsWith('image/')) {
        return true;
    }
    const trimmed = bodyText.trimStart();
    return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml');
}

export type PlantumlProbeResult =
    | { ok: true; status: number; contentType: string | null }
    | { ok: false; reason: string; status?: number; contentType?: string | null };

/**
 * Probe a PlantUML Server Base URL with the minimal test diagram.
 * Never attaches auth headers.
 */
export async function probePlantumlServer(base: string, fetchImpl: typeof fetch = fetch): Promise<PlantumlProbeResult> {
    let url: string;
    try {
        url = buildPlantumlTestUrl(base);
    } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
    }

    let response: Response;
    try {
        response = await fetchImpl(url, { method: 'GET' });
    } catch (error) {
        return {
            ok: false,
            reason: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }

    const contentType = response.headers.get('content-type');
    let bodyText = '';
    try {
        // Read a small prefix so SVG detection works without loading huge bodies.
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const sample = bytes.subarray(0, Math.min(bytes.length, 256));
        bodyText = new TextDecoder('utf-8', { fatal: false }).decode(sample);
    } catch {
        bodyText = '';
    }

    if (response.status !== 200) {
        return {
            ok: false,
            reason: `HTTP ${response.status}`,
            status: response.status,
            contentType,
        };
    }

    if (!looksLikePlantumlImage(contentType, bodyText)) {
        return {
            ok: false,
            reason: `HTTP 200 but response is not an image (Content-Type: ${contentType || 'none'})`,
            status: 200,
            contentType,
        };
    }

    return { ok: true, status: 200, contentType };
}
