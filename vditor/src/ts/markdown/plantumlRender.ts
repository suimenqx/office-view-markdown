import {Constants} from "../constants";
import {addScript} from "../util/addScript";
import {plantumlRenderAdapter} from "./adapterRender";
import {ensurePlantumlChrome} from "./plantumlChrome";
import {buildPlantumlRenderUrl, normalizePlantumlServerBase} from "./plantumlUrl";
import {renderActionableEmptyState, sanitizeActionableErrorMessage} from "../ui/actionableEmptyState";

declare const plantumlEncoder: {
    encode(options: string): string,
};

const PLANTUML_SOURCE_ATTR = "data-plantuml";

const plantumlRenderFailedBody = () =>
    window.VditorI18n?.actionablePlantumlRenderFailedBody
    || "Check the diagram syntax and try again.";

const showPlantumlRenderFailure = (
    e: HTMLDivElement,
    reason: unknown,
    cdn: string,
    vditor?: IVditor,
) => {
    e.classList.add("vditor-reset--error");
    renderActionableEmptyState(e, {
        title: window.VditorI18n?.actionablePlantumlRenderFailed || "PlantUML render failed",
        body: sanitizeActionableErrorMessage(reason, plantumlRenderFailedBody()),
        actionLabel: window.VditorI18n?.actionableRetry || "Retry",
        variant: "error",
        onAction: () => {
            const root = vditor?.[vditor.currentMode].element || e.parentElement;
            if (root) {
                plantumlRender(root, cdn, vditor);
            }
        },
    });
};

const showPlantumlPlaceholder = (e: HTMLDivElement, text: string, vditor?: IVditor) => {
    e.setAttribute(PLANTUML_SOURCE_ATTR, text);
    e.classList.remove("vditor-reset--error");
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
            if (e.parentElement.classList.contains("vditor-wysiwyg__pre") ||
                e.parentElement.classList.contains("vditor-ir__marker--pre")) {
                return;
            }
            const text = plantumlRenderAdapter.getCode(e).trim()
                || e.getAttribute(PLANTUML_SOURCE_ATTR)?.trim()
                || "";
            if (!text) {
                return;
            }
            showPlantumlPlaceholder(e, text, vditor);
        });
        return;
    }

    addScript(`${cdn}/dist/js/plantuml/plantuml-encoder.min.js`, "vditorPlantumlScript").then(() => {
        plantumlElements.forEach((e: HTMLDivElement) => {
            if (e.parentElement.classList.contains("vditor-wysiwyg__pre") ||
                e.parentElement.classList.contains("vditor-ir__marker--pre")) {
                return;
            }
            const text = plantumlRenderAdapter.getCode(e).trim()
                || e.getAttribute(PLANTUML_SOURCE_ATTR)?.trim()
                || "";
            if (!text) {
                return;
            }
            try {
                const url = buildPlantumlRenderUrl(serverBase, plantumlEncoder.encode(text));
                e.setAttribute(PLANTUML_SOURCE_ATTR, text);
                e.classList.remove("vditor-reset--error");
                e.innerHTML = `<img src="${url}">`;
                const img = e.querySelector("img");
                if (img) {
                    img.addEventListener("error", () => {
                        showPlantumlRenderFailure(
                            e,
                            window.VditorI18n?.actionablePlantumlRenderFailedBody
                                || "PlantUML image failed to load",
                            cdn,
                            vditor,
                        );
                    }, {once: true});
                }
                ensurePlantumlChrome(e, url, vditor);
            } catch (error) {
                showPlantumlRenderFailure(e, error, cdn, vditor);
            }
        });
    });
};
