/**
 * ADR 0016 / 0015: appearance (theme, font size, line-height) must not dirty
 * the host Markdown document or trigger pretty-normalize write-back.
 *
 * Callers that only mutate chrome / CSS variables should pass through
 * `assertAppearanceLeavesDocumentClean` in tests; production paths must avoid
 * `fireContentInput` / `noteAuthoredIntent`.
 */

import {isDocumentDirty} from "./saveToolbarState";

export const APPEARANCE_WRITE_FORBIDDEN_APIS = [
    "fireContentInput",
    "noteAuthoredIntent",
] as const;

/** Runtime check: after an appearance-only mutation, the tab must stay clean. */
export const assertAppearanceLeavesDocumentClean = (vditor: IVditor): boolean => {
    return !isDocumentDirty(vditor);
};

/**
 * Apply a CSS appearance mutation without touching Markdown bytes.
 * Used by unit tests to model theme / font / line-height updates.
 */
export const applyAppearanceCssOnly = (
    element: HTMLElement,
    patch: {theme?: string; fontSizePx?: number; lineHeight?: number},
): void => {
    if (patch.theme) {
        element.setAttribute("data-editor-theme", patch.theme);
        document.documentElement.setAttribute("data-editor-theme", patch.theme);
    }
    if (typeof patch.fontSizePx === "number" && Number.isFinite(patch.fontSizePx)) {
        element.style.setProperty("--editor-font-size", `${patch.fontSizePx}px`);
    }
    if (typeof patch.lineHeight === "number" && Number.isFinite(patch.lineHeight)) {
        element.style.setProperty("--editor-line-height", String(patch.lineHeight));
    }
};
