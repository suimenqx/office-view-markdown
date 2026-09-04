/** Normalize PlantUML Server Base URL: trim and strip trailing slashes. */
export const normalizePlantumlServerBase = (base?: string | null): string => {
    if (!base) {
        return "";
    }
    return base.trim().replace(/\/+$/, "");
};

/**
 * Build PlantUML SVG render URL.
 * - if base already ends with `/svg` or `/png`, append `/~1{encoded}`
 * - else append `/svg/~1{encoded}`
 */
export const buildPlantumlRenderUrl = (base: string, encoded: string): string => {
    const normalized = normalizePlantumlServerBase(base);
    if (!normalized) {
        throw new Error("PlantUML Server Base URL is not configured");
    }
    const payload = `/~1${encoded}`;
    if (/\/(svg|png)$/i.test(normalized)) {
        return `${normalized}${payload}`;
    }
    return `${normalized}/svg${payload}`;
};
