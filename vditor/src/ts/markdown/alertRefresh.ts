import { applyGitHubAlertClasses, getGitHubAlertEditScope } from "./githubAlerts";

/** Shared IR/WYSIWYG prelude that refreshes GitHub Alert presentation classes. */
export const refreshGitHubAlertPresentation = (
    editorElement: HTMLElement,
    alertScope?: ParentNode,
) => {
    const scope = alertScope || getGitHubAlertEditScope(editorElement);
    if (scope) {
        applyGitHubAlertClasses(editorElement, scope);
    }
};
