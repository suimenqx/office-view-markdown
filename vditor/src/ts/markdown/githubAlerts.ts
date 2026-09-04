const ALERT_TYPES = ["note", "tip", "warning", "caution", "important"] as const;

export type GitHubAlertType = typeof ALERT_TYPES[number];

const ALERT_CLASSES = ALERT_TYPES.map((type) => `alert--${type}`);
const ALERT_MARKER = /^\s*\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\](?=\s|$|:)/i;

export const getGitHubAlertClass = (value: string | null | undefined): string | undefined => {
    const match = value?.match(ALERT_MARKER);
    return match ? `alert--${match[1].toLowerCase()}` : undefined;
};

/** Add semantic classes only; the marker remains in the editable DOM and Markdown source. */
export const applyGitHubAlertClasses = (editorElement: HTMLElement) => {
    editorElement.querySelectorAll<HTMLQuoteElement>("blockquote").forEach((blockquote) => {
        blockquote.classList.remove(...ALERT_CLASSES);
        const alertClass = getGitHubAlertClass(blockquote.textContent);
        if (alertClass) {
            blockquote.classList.add(alertClass);
        }
    });
};
