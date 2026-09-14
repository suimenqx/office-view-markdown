/** Find chrome owns keyboard focus; match reveal must not take it back. */
export const isFindFieldFocused = (
    activeElement: Element | null,
    findInput: Element | null,
    replaceInput: Element | null,
) => activeElement === findInput || activeElement === replaceInput;

/** Composition is still Find input work even if focus briefly moves during IME. */
export const shouldStealEditorFocusForMatch = (
    findFieldFocused: boolean,
    composing: boolean,
) => !findFieldFocused && !composing;
