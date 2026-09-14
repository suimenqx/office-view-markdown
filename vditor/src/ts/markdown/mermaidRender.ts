import {Constants} from "../constants";
import {addScript} from "../util/addScript";
import {
    beginAsyncRenderGeneration,
    canCommitAsyncRender,
    fingerprintThemeConfig,
    invalidateAllAsyncRenderGenerations,
    type AsyncRenderGeneration,
} from "../util/asyncRenderGeneration";
import {MERMAID_THEME_ATTR} from "../ui/mermaidThemeCatalog";
import {resolveMermaidTheme} from "../ui/setMermaidTheme";
import {mermaidRenderAdapter} from "./adapterRender";
import {ensureMermaidChrome} from "./mermaidChrome";
import {buildMermaidInitConfig, findVditorRoot} from "./mermaidTheme";
import {renderActionableEmptyState, removeActionableEmptyState, sanitizeActionableErrorMessage} from "../ui/actionableEmptyState";

declare const mermaid: {
    initialize(options: unknown): void,
    render(
        id: string,
        code: string,
        container?: Element,
    ): Promise<{ svg: string; bindFunctions?: (element: Element) => void }>,
};

const MERMAID_PROCESSED_ATTR = "data-vditor-mermaid-processed";
const MERMAID_SOURCE_ATTR = "data-mermaid";
const MERMAID_LOADING_ATTR = "data-async-render-loading";

const MERMAID_BASE_CONFIG = {
    altFontFamily: "sans-serif",
    flowchart: {
        htmlLabels: true,
        useMaxWidth: true,
    },
    fontFamily: "sans-serif",
    gantt: {
        leftPadding: 75,
        rightPadding: 20,
    },
    securityLevel: "loose",
    sequence: {
        boxMargin: 8,
        diagramMarginX: 8,
        diagramMarginY: 8,
        useMaxWidth: true,
    },
    startOnLoad: false,
};

let renderCounter = 0;
let refreshTimer: ReturnType<typeof setTimeout> | undefined;

const storeMermaidSource = (item: Element, code: string) => {
    if (code.trim()) {
        item.setAttribute(MERMAID_SOURCE_ATTR, code);
    }
};

const getMermaidSource = (item: Element) => {
    return item.getAttribute(MERMAID_SOURCE_ATTR) || mermaidRenderAdapter.getCode(item);
};

const clearMermaidElement = (item: HTMLElement) => {
    item.removeAttribute("data-processed");
    item.removeAttribute(MERMAID_PROCESSED_ATTR);
    item.removeAttribute(MERMAID_LOADING_ATTR);
    item.removeAttribute("id");
    item.classList.remove("vditor-reset--error");
    removeActionableEmptyState(item);
    const source = item.getAttribute(MERMAID_SOURCE_ATTR);
    if (source) {
        item.textContent = source;
        return;
    }
    item.innerHTML = "";
};

/** Dispose prior chrome before a new generation — no stacked loading/ready/error. */
const enterMermaidLoading = (item: HTMLElement) => {
    clearMermaidElement(item);
    item.setAttribute(MERMAID_LOADING_ATTR, "true");
};

const exitMermaidLoading = (item: HTMLElement) => {
    item.removeAttribute(MERMAID_LOADING_ATTR);
};

const mermaidThemeConfigKey = (themeRoot: HTMLElement, vditor?: IVditor) => {
    const themeId = vditor
        ? resolveMermaidTheme(vditor.options)
        : (themeRoot.getAttribute(MERMAID_THEME_ATTR) || "Auto");
    return fingerprintThemeConfig("mermaid", themeId);
};

const commitMermaidReady = (
    item: HTMLElement,
    generation: AsyncRenderGeneration,
    svg: string,
    bindFunctions?: (element: Element) => void,
) => {
    if (!canCommitAsyncRender(generation, item)) {
        return false;
    }
    exitMermaidLoading(item);
    item.classList.remove("vditor-reset--error");
    removeActionableEmptyState(item);
    item.innerHTML = svg;
    bindFunctions?.(item);
    item.setAttribute(MERMAID_PROCESSED_ATTR, "true");
    return true;
};

const commitMermaidError = (
    item: HTMLElement,
    generation: AsyncRenderGeneration,
    error: unknown,
    onRetry?: () => void,
) => {
    if (!canCommitAsyncRender(generation, item)) {
        return false;
    }
    exitMermaidLoading(item);
    const fallback = window.VditorI18n?.actionableMermaidRenderFailedBody
        || "Check the diagram syntax and try again.";
    item.classList.add("vditor-reset--error");
    // Replace any prior content atomically — mutually exclusive with loading/ready.
    item.innerHTML = "";
    renderActionableEmptyState(item, {
        title: window.VditorI18n?.actionableMermaidRenderFailed || "Mermaid render failed",
        body: sanitizeActionableErrorMessage(error, fallback),
        actionLabel: window.VditorI18n?.actionableRetry || "Retry",
        variant: "error",
        onAction: onRetry,
    });
    item.setAttribute(MERMAID_PROCESSED_ATTR, "true");
    return true;
};

const renderSingleMermaid = async (
    item: HTMLElement,
    code: string,
    index: number,
    themeRoot: HTMLElement,
    vditor?: IVditor,
) => {
    storeMermaidSource(item, code);
    const themeConfig = mermaidThemeConfigKey(themeRoot, vditor);
    const generation = beginAsyncRenderGeneration(item, code, themeConfig);
    // ADR 0013 / Studio: dispose prior SVG/AES before await — no stale flash.
    enterMermaidLoading(item);

    const retry = () => {
        // ADR 0013 ticket 03: re-read current source + theme, never closed-over snapshot.
        const currentCode = getMermaidSource(item).trim();
        if (!currentCode) {
            return;
        }
        void renderSingleMermaid(item, currentCode, index, themeRoot, vditor);
    };

    const renderId = `vditor-mermaid-${++renderCounter}-${Date.now()}-${index}`;
    try {
        const {svg, bindFunctions} = await mermaid.render(renderId, code, item);
        if (!commitMermaidReady(item, generation, svg, bindFunctions)) {
            return;
        }
        if (vditor) {
            ensureMermaidChrome(vditor, item);
        }
    } catch (error: unknown) {
        commitMermaidError(item, generation, error, retry);
    }
};

const getThemeId = (themeRoot: HTMLElement, vditor?: IVditor) => {
    if (vditor) {
        return resolveMermaidTheme(vditor.options);
    }
    return themeRoot.getAttribute(MERMAID_THEME_ATTR) || "Auto";
};

const renderMermaidElements = async (
    mermaidElements: NodeListOf<Element> | Element[],
    themeRoot: HTMLElement,
    vditor?: IVditor,
) => {
    const themeId = getThemeId(themeRoot, vditor);
    const themeConfig = buildMermaidInitConfig(themeId, themeRoot);
    mermaid.initialize({...MERMAID_BASE_CONFIG, ...themeConfig});
    for (let i = 0; i < mermaidElements.length; i++) {
        const item = mermaidElements[i] as HTMLElement;
        if (item.getAttribute(MERMAID_PROCESSED_ATTR) === "true"
            && item.getAttribute(MERMAID_LOADING_ATTR) !== "true") {
            continue;
        }
        const code = getMermaidSource(item).trim();
        if (!code) {
            continue;
        }
        await renderSingleMermaid(item, code, i, themeRoot, vditor);
    }
};

const doRefreshMermaidTheme = (root: HTMLElement, cdn: string, vditor?: IVditor) => {
    const mermaidElements = root.querySelectorAll(`.language-mermaid[${MERMAID_PROCESSED_ATTR}='true'], .language-mermaid[${MERMAID_LOADING_ATTR}='true']`);
    if (mermaidElements.length === 0) {
        return;
    }
    // Theme remount invalidates all in-flight generations (ADR 0013 ticket 02).
    invalidateAllAsyncRenderGenerations();
    for (let i = 0; i < mermaidElements.length; i++) {
        clearMermaidElement(mermaidElements[i] as HTMLElement);
    }
    addScript(`${cdn}/dist/js/mermaid/mermaid.min.js`, "vditorMermaidScript").then(() => {
        renderMermaidElements(mermaidElements, root, vditor);
    });
};

export const mermaidRender = (
    element: HTMLElement,
    cdn = Constants.CDN,
    vditorOrThemeRoot?: IVditor | HTMLElement,
) => {
    const mermaidElements = mermaidRenderAdapter.getElements(element);
    if (mermaidElements.length === 0) {
        return;
    }
    let themeRoot: HTMLElement;
    let vditor: IVditor | undefined;
    if (vditorOrThemeRoot && "options" in vditorOrThemeRoot) {
        vditor = vditorOrThemeRoot;
        themeRoot = vditor.element;
    } else {
        themeRoot = (vditorOrThemeRoot as HTMLElement | undefined) ?? findVditorRoot(element);
    }
    addScript(`${cdn}/dist/js/mermaid/mermaid.min.js`, "vditorMermaidScript").then(() => {
        renderMermaidElements(mermaidElements, themeRoot, vditor);
    });
};

export const refreshMermaidTheme = (root: HTMLElement, cdn = Constants.CDN, vditor?: IVditor) => {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        doRefreshMermaidTheme(root, cdn, vditor);
    }, 50);
};
