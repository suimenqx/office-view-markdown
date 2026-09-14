import {Constants} from "../constants";
import {addScript} from "../util/addScript";
import {
    beginAsyncRenderGeneration,
    canCommitAsyncRender,
    fingerprintThemeConfig,
    type AsyncRenderGeneration,
} from "../util/asyncRenderGeneration";
import {plantumlRenderAdapter} from "./adapterRender";
import {ensurePlantumlChrome} from "./plantumlChrome";
import {buildPlantumlRenderUrl, normalizePlantumlServerBase} from "./plantumlUrl";
import {renderActionableEmptyState, removeActionableEmptyState, sanitizeActionableErrorMessage} from "../ui/actionableEmptyState";

declare const plantumlEncoder: {
    encode(options: string): string,
};

const PLANTUML_SOURCE_ATTR = "data-plantuml";
const PLANTUML_LOADING_ATTR = "data-async-render-loading";

const plantumlRenderFailedBody = () =>
    window.VditorI18n?.actionablePlantumlRenderFailedBody
    || "Check the diagram syntax and try again.";

const plantumlThemeConfigKey = (serverBase: string) =>
    fingerprintThemeConfig("plantuml", serverBase);

const enterPlantumlLoading = (e: HTMLElement) => {
    e.classList.remove("vditor-reset--error");
    removeActionableEmptyState(e);
    e.removeAttribute(PLANTUML_LOADING_ATTR);
    e.setAttribute(PLANTUML_LOADING_ATTR, "true");
    // Clear prior img/SVG/AES so stale chrome cannot flash (ADR 0013 Studio).
    e.innerHTML = "";
};

const exitPlantumlLoading = (e: HTMLElement) => {
    e.removeAttribute(PLANTUML_LOADING_ATTR);
};

const readPlantumlSource = (e: Element): string =>
    // Prefer stored source: after AES chrome, textContent is UI copy not diagram source.
    e.getAttribute(PLANTUML_SOURCE_ATTR)?.trim()
    || plantumlRenderAdapter.getCode(e).trim()
    || "";

const showPlantumlRenderFailure = (
    e: HTMLDivElement,
    generation: AsyncRenderGeneration,
    reason: unknown,
    cdn: string,
    vditor?: IVditor,
) => {
    if (!canCommitAsyncRender(generation, e)) {
        return;
    }
    exitPlantumlLoading(e);
    e.classList.add("vditor-reset--error");
    e.innerHTML = "";
    renderActionableEmptyState(e, {
        title: window.VditorI18n?.actionablePlantumlRenderFailed || "PlantUML render failed",
        body: sanitizeActionableErrorMessage(reason, plantumlRenderFailedBody()),
        actionLabel: window.VditorI18n?.actionableRetry || "Retry",
        variant: "error",
        onAction: () => {
            // Ticket 03: Retry re-enters plantumlRender which re-reads current source.
            const root = vditor?.[vditor.currentMode].element || e.parentElement;
            if (root) {
                plantumlRender(root as HTMLElement, cdn, vditor);
            }
        },
    });
};

const showPlantumlPlaceholder = (e: HTMLDivElement, text: string, vditor?: IVditor) => {
    e.setAttribute(PLANTUML_SOURCE_ATTR, text);
    e.classList.remove("vditor-reset--error");
    exitPlantumlLoading(e);
    removeActionableEmptyState(e);
    e.innerHTML = "";
    renderActionableEmptyState(e, {
        title: window.VditorI18n?.actionablePlantumlUnconfigured || "PlantUML Server is not configured",
        body: window.VditorI18n?.actionablePlantumlUnconfiguredBody
            || "Diagram source is not sent anywhere until you set a PlantUML Server Base URL.",
        actionLabel: window.VditorI18n?.actionableOpenSettings || "Open Settings",
        variant: "info",
        onAction: () => {
            if (typeof vditor?.options.onOpenPlantumlSettings === "function") {
                vditor.options.onOpenPlantumlSettings();
            }
        },
    });
};

const commitPlantumlImage = (
    e: HTMLDivElement,
    generation: AsyncRenderGeneration,
    url: string,
    text: string,
    cdn: string,
    vditor?: IVditor,
) => {
    if (!canCommitAsyncRender(generation, e)) {
        return false;
    }
    e.setAttribute(PLANTUML_SOURCE_ATTR, text);
    e.classList.remove("vditor-reset--error");
    removeActionableEmptyState(e);
    e.innerHTML = `<img src="${url}">`;
    exitPlantumlLoading(e);
    const img = e.querySelector("img");
    if (img) {
        img.addEventListener("error", () => {
            showPlantumlRenderFailure(
                e,
                generation,
                window.VditorI18n?.actionablePlantumlRenderFailedBody
                    || "PlantUML image failed to load",
                cdn,
                vditor,
            );
        }, {once: true});
    }
    ensurePlantumlChrome(e, url, vditor);
    return true;
};

export const plantumlRender = (
    element: (HTMLElement | Document) = document,
    cdn = Constants.CDN,
    vditor?: IVditor,
) => {
    const plantumlElements = plantumlRenderAdapter.getElements(element);
    if (plantumlElements.length === 0) {
        return;
    }

    const serverBase = normalizePlantumlServerBase(vditor?.options.plantumlServer);
    if (!serverBase) {
        plantumlElements.forEach((e: HTMLDivElement) => {
            if (e.parentElement?.classList.contains("vditor-wysiwyg__pre") ||
                e.parentElement?.classList.contains("vditor-ir__marker--pre")) {
                return;
            }
            const text = readPlantumlSource(e);
            if (!text) {
                return;
            }
            // Unconfigured is synchronous AES (ADR 0003) — still begin+commit under guard
            // so a later configured render supersedes cleanly.
            const generation = beginAsyncRenderGeneration(
                e,
                text,
                plantumlThemeConfigKey(""),
            );
            if (!canCommitAsyncRender(generation, e)) {
                return;
            }
            showPlantumlPlaceholder(e, text, vditor);
        });
        return;
    }

    const themeConfig = plantumlThemeConfigKey(serverBase);

    // Capture per-element generations before script load so a late encoder callback
    // cannot write after edit/theme supersede.
    const pending: Array<{
        el: HTMLDivElement;
        text: string;
        generation: AsyncRenderGeneration;
    }> = [];

    plantumlElements.forEach((e: HTMLDivElement) => {
        if (e.parentElement?.classList.contains("vditor-wysiwyg__pre") ||
            e.parentElement?.classList.contains("vditor-ir__marker--pre")) {
            return;
        }
        const text = readPlantumlSource(e);
        if (!text) {
            return;
        }
        const generation = beginAsyncRenderGeneration(e, text, themeConfig);
        enterPlantumlLoading(e);
        e.setAttribute(PLANTUML_SOURCE_ATTR, text);
        pending.push({el: e, text, generation});
    });

    if (pending.length === 0) {
        return;
    }

    addScript(`${cdn}/dist/js/plantuml/plantuml-encoder.min.js`, "vditorPlantumlScript").then(() => {
        for (const {el, text, generation} of pending) {
            if (!canCommitAsyncRender(generation, el)) {
                continue;
            }
            // Re-read source at commit time (Retry / mid-flight edit safety).
            const currentText = readPlantumlSource(el) || text;
            if (currentText !== text) {
                // Source moved — this generation is conceptually stale; skip write.
                // A newer beginAsyncRenderGeneration from the edit path owns the block.
                continue;
            }
            try {
                const url = buildPlantumlRenderUrl(serverBase, plantumlEncoder.encode(currentText));
                commitPlantumlImage(el, generation, url, currentText, cdn, vditor);
            } catch (error) {
                showPlantumlRenderFailure(el, generation, error, cdn, vditor);
            }
        }
    });
};
