export type ActionableEmptyStateVariant = "info" | "warning" | "error";

export type ActionableEmptyStateOptions = {
    title: string;
    body: string;
    actionLabel: string;
    onAction?: () => void;
    /** Visual accent: info for unconfigured; warning/error for failures. Defaults to warning. */
    variant?: ActionableEmptyStateVariant;
};

const MAX_SANITIZED_MESSAGE_LENGTH = 160;

const looksLikeStackFrame = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) {
        return true;
    }
    if (/^\s*at\s+/.test(trimmed)) {
        return true;
    }
    if (/^(?:file|https?):\/\//i.test(trimmed)) {
        return true;
    }
    if (/\(\S+:\d+:\d+\)$/.test(trimmed)) {
        return true;
    }
    return false;
};

/** Short readable reason for AES body — no stack dumps. */
export const sanitizeActionableErrorMessage = (
    error: unknown,
    fallback = "Something went wrong. Please try again.",
): string => {
    const raw = error instanceof Error
        ? (error.message || String(error))
        : String(error ?? "");
    const lines = raw.replace(/\r\n/g, "\n").split("\n");
    let first = "";
    for (const line of lines) {
        if (!looksLikeStackFrame(line)) {
            first = line.trim();
            break;
        }
    }
    if (!first) {
        return fallback;
    }
    // Drop trailing stack-ish crumbs on the same line
    first = first.replace(/\s+at\s+\S.*$/, "").trim();
    if (!first || looksLikeStackFrame(first)) {
        return fallback;
    }
    if (first.length > MAX_SANITIZED_MESSAGE_LENGTH) {
        return `${first.slice(0, MAX_SANITIZED_MESSAGE_LENGTH - 1).trimEnd()}…`;
    }
    return first;
};

/** Render one consistent failure state without replacing the source-bearing host element. */
export const renderActionableEmptyState = (
    root: HTMLElement,
    options: ActionableEmptyStateOptions,
) => {
    const variant: ActionableEmptyStateVariant = options.variant ?? "warning";
    const state = document.createElement("div");
    state.className = `vditor-actionable-empty-state vditor-actionable-empty-state--${variant}`;
    state.setAttribute("data-vditor-generated", "true");
    state.setAttribute("data-variant", variant);
    state.setAttribute("role", "alert");

    const title = document.createElement("div");
    title.className = "vditor-actionable-empty-state__title";
    title.textContent = options.title;

    const body = document.createElement("div");
    body.className = "vditor-actionable-empty-state__body";
    body.textContent = options.body;

    const action = document.createElement("button");
    action.type = "button";
    action.className = "vditor-actionable-empty-state__action";
    action.textContent = options.actionLabel;
    if (options.onAction) {
        action.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            options.onAction?.();
        });
    } else {
        action.disabled = true;
    }

    state.append(title, body, action);
    root.replaceChildren(state);
};

/** Remove Actionable Empty State cards only (not other generated chrome). */
export const removeActionableEmptyState = (root: ParentNode) => {
    root.querySelectorAll(".vditor-actionable-empty-state").forEach((element) => element.remove());
};
