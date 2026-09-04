import {Constants} from "../constants";
import {addScript} from "../util/addScript";
import {plantumlRenderAdapter} from "./adapterRender";
import {ensurePlantumlChrome} from "./plantumlChrome";
import {buildPlantumlRenderUrl, normalizePlantumlServerBase} from "./plantumlUrl";

declare const plantumlEncoder: {
    encode(options: string): string,
};

const PLANTUML_SOURCE_ATTR = "data-plantuml";

const showPlantumlPlaceholder = (e: HTMLDivElement, text: string, vditor?: IVditor) => {
    e.setAttribute(PLANTUML_SOURCE_ATTR, text);
    e.classList.remove("vditor-reset--error");
    e.innerHTML = `<div class="vditor-plantuml-placeholder" role="note">
  <div class="vditor-plantuml-placeholder__title">PlantUML Server is not configured</div>
  <div class="vditor-plantuml-placeholder__body">Diagram source is not sent anywhere until you set a PlantUML Server Base URL.</div>
  <button type="button" class="vditor-plantuml-placeholder__action">Open Settings</button>
</div>`;
    const button = e.querySelector(".vditor-plantuml-placeholder__action") as HTMLButtonElement | null;
    button?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof vditor?.options.onOpenPlantumlSettings === "function") {
            vditor.options.onOpenPlantumlSettings();
        }
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
                ensurePlantumlChrome(e, url, vditor);
            } catch (error) {
                e.className = "vditor-reset--error";
                e.innerHTML = `plantuml render error: <br>${error}`;
            }
        });
    });
};
