export const EDITOR_FONT_SIZE_MIN = 12;
export const EDITOR_FONT_SIZE_MAX = 28;
export const EDITOR_FONT_SIZE_STEP = 2;
export const VSCODE_EDITOR_FONT_SIZE_FALLBACK = 14;

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

/** Resolve the Reading Surface size; zero means follow VS Code's editor.fontSize. */
export const resolveEditorFontSize = (
    configured: unknown,
    vscodeEditorFontSize: unknown,
): number => {
    if (isFiniteNumber(configured) && configured >= EDITOR_FONT_SIZE_MIN && configured <= EDITOR_FONT_SIZE_MAX) {
        return configured;
    }
    if (isFiniteNumber(vscodeEditorFontSize) && vscodeEditorFontSize > 0) {
        return vscodeEditorFontSize;
    }
    return VSCODE_EDITOR_FONT_SIZE_FALLBACK;
};
