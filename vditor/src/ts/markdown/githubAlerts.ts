const ALERT_TYPES = ["note", "tip", "warning", "caution", "important"] as const;

export type GitHubAlertType = typeof ALERT_TYPES[number];

const ALERT_CLASSES = ALERT_TYPES.map((type) => `alert--${type}`);
const ALERT_MARKER = new RegExp(
    `^\\s*\\[!(${ALERT_TYPES.join("|")})\\](?=\\s|$|:)`,
    "i",
);

export const getGitHubAlertClass = (value: string | null | undefined): string | undefined => {
    const match = value?.match(ALERT_MARKER);
    return match ? `alert--${match[1].toLowerCase()}` : undefined;
};

export const getGitHubAlertClassForCallout = (subtype: string | null | undefined): string | undefined =>
    getGitHubAlertClass(subtype ? `[!${subtype}]` : undefined);

/** Add semantic classes only; the marker remains in the editable DOM and Markdown source. */
export const applyGitHubAlertClasses = (editorElement: HTMLElement) => {
    editorElement.querySelectorAll<HTMLElement>("blockquote, div[data-type='callout']").forEach((element) => {
        const isCallout = element.getAttribute("data-type") === "callout";
        const alertClass = isCallout
            ? getGitHubAlertClassForCallout(element.getAttribute("data-subtype"))
            : getGitHubAlertClass(element.textContent);
        for (const alertClassName of ALERT_CLASSES) {
            if (alertClassName !== alertClass) {
                element.classList.remove(alertClassName);
            }
        }
        if (alertClass && !element.classList.contains(alertClass)) {
            element.classList.add(alertClass);
        }
    });
};

/** Remove generated callout icons from the export clone, preserving source text. */
export const stripGitHubAlertPresentation = (root: ParentNode) => {
    root.querySelectorAll<HTMLElement>("div[data-type='callout'][data-subtype]").forEach((callout) => {
        if (!getGitHubAlertClassForCallout(callout.getAttribute("data-subtype"))) {
            return;
        }
        callout.querySelectorAll(".vditor-callout__icon").forEach((icon) => icon.remove());
    });
};
