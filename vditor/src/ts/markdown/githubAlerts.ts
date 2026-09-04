const ALERT_TYPES = ["note", "tip", "warning", "caution", "important"] as const;

export type GitHubAlertType = typeof ALERT_TYPES[number];

const ALERT_CLASSES = ALERT_TYPES.map((type) => `alert--${type}`);
const ALERT_MARKER = new RegExp(
    `^\\s*\\[!(${ALERT_TYPES.join("|")})\\](?=\\s|$|:)`,
    "i",
);
const ALERT_SOURCE_MARKER = new RegExp(
    `^[ \\t]{0,3}>[ \\t]*\\[!(${ALERT_TYPES.join("|")})\\](?=\\s|$|:)(.*)$`,
    "gim",
);
const ALERT_PRESENTATION_UNTITLED = "data-ovm-github-alert-untitled";

const isUntitledAlertRemainder = (remainder: string) =>
    remainder.replace(/^\\s*:/, "").trim().length === 0;

export const getGitHubAlertClass = (value: string | null | undefined): string | undefined => {
    const match = value?.match(ALERT_MARKER);
    return match ? `alert--${match[1].toLowerCase()}` : undefined;
};

export const getGitHubAlertClassForCallout = (subtype: string | null | undefined): string | undefined =>
    getGitHubAlertClass(subtype ? `[!${subtype}]` : undefined);

type AlertSource = {
    type: GitHubAlertType;
    untitled: boolean;
};

const getAlertSources = (markdown: string): AlertSource[] => {
    const sources: AlertSource[] = [];
    ALERT_SOURCE_MARKER.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ALERT_SOURCE_MARKER.exec(markdown)) !== null) {
        sources.push({
            type: match[1].toLowerCase() as GitHubAlertType,
            untitled: isUntitledAlertRemainder(match[2]),
        });
    }
    return sources;
};

/** Remember which rendered callouts had no source title before Lute adds one. */
export const markGitHubAlertSourceTitles = (editorRoot: ParentNode, markdown: string) => {
    const sources = getAlertSources(markdown);
    let sourceIndex = 0;
    const blocks = Array.from(
        editorRoot.querySelectorAll<HTMLElement>("blockquote, div[data-type='callout']"),
    );
    for (const block of blocks) {
        const isCallout = block.getAttribute("data-type") === "callout";
        const alertClass = isCallout
            ? getGitHubAlertClassForCallout(block.getAttribute("data-subtype"))
            : getGitHubAlertClass(block.textContent);
        if (!alertClass) {
            continue;
        }
        const type = alertClass.slice("alert--".length) as GitHubAlertType;
        const matchingSourceIndex = sources.findIndex((source, index) =>
            index >= sourceIndex && source.type === type,
        );
        if (matchingSourceIndex === -1) {
            continue;
        }
        const source = sources[matchingSourceIndex];
        sourceIndex = matchingSourceIndex + 1;
        if (isCallout && source.untitled) {
            block.setAttribute(ALERT_PRESENTATION_UNTITLED, "true");
        } else {
            block.removeAttribute(ALERT_PRESENTATION_UNTITLED);
        }
    }
};

/** Add semantic classes only; the marker remains in the editable DOM and Markdown source. */
export const applyGitHubAlertClasses = (editorElement: HTMLElement, scope: ParentNode = editorElement) => {
    const elements: HTMLElement[] = [];
    const scopeElement = scope as HTMLElement;
    if (typeof scopeElement.matches === "function" &&
        scopeElement.matches("blockquote, div[data-type='callout']")) {
        elements.push(scopeElement);
    }
    elements.push(...scope.querySelectorAll<HTMLElement>("blockquote, div[data-type='callout']"));
    elements.forEach((element) => {
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

/** Find the smallest DOM scope affected by the current edit, if it is available. */
export const getGitHubAlertEditScope = (editorElement: HTMLElement): ParentNode | undefined => {
    const selection = window.getSelection?.();
    const anchor = selection?.anchorNode;
    if (!anchor || !editorElement.contains(anchor)) {
        return undefined;
    }
    const anchorElement = anchor.nodeType === 1 ? anchor as HTMLElement : anchor.parentElement;
    return anchorElement?.closest("blockquote, div[data-type='callout']") || anchorElement;
};

/** Remove generated callout icons from the export clone, preserving source text. */
export const stripGitHubAlertPresentation = (root: ParentNode) => {
    root.querySelectorAll<HTMLElement>("div[data-type='callout'][data-subtype]").forEach((callout) => {
        if (!getGitHubAlertClassForCallout(callout.getAttribute("data-subtype"))) {
            return;
        }
        callout.querySelectorAll(".vditor-callout__icon").forEach((icon) => icon.remove());
        callout.removeAttribute("data-callout-icon");
        if (callout.getAttribute(ALERT_PRESENTATION_UNTITLED) === "true") {
            callout.querySelectorAll(".vditor-callout__title").forEach((title) => title.remove());
            callout.removeAttribute("data-callout-title");
        }
        callout.removeAttribute(ALERT_PRESENTATION_UNTITLED);
    });
};
