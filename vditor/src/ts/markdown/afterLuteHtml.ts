import { markGitHubAlertSourceTitles } from "./githubAlerts";
import {
    applyFrontMatterPresentation,
    resolveFrontMatterPresentation,
} from "../ui/frontMatterPresentation";

/** Shared Md→DOM presentation pass after Lute HTML is mounted. */
export const applyAfterLuteHtmlPresentation = (
    root: ParentNode,
    markdown: string,
    frontMatterPresentation?: unknown,
) => {
    markGitHubAlertSourceTitles(root, markdown);
    applyFrontMatterPresentation(
        root,
        resolveFrontMatterPresentation(frontMatterPresentation),
    );
};
