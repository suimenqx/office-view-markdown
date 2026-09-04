export type ActionableEmptyStateOptions = {
    title: string;
    body: string;
    actionLabel: string;
    onAction?: () => void;
};

/** Render one consistent failure state without replacing the source-bearing host element. */
export const renderActionableEmptyState = (
    root: HTMLElement,
    options: ActionableEmptyStateOptions,
) => {
    const state = document.createElement("div");
    state.className = "vditor-actionable-empty-state";
    state.setAttribute("data-vditor-generated", "true");
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

export const removeActionableEmptyState = (root: ParentNode) => {
    root.querySelectorAll("[data-vditor-generated='true']").forEach((element) => element.remove());
};
