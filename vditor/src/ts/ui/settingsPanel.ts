import {
    getGlobalLocalStorageSetting,
    UI_FONT_SIZE_KEY,
    EDITOR_FONT_SIZE_KEY,
    UI_FONT_SIZE_DEFAULT,
    EDITOR_FONT_SIZE_DEFAULT,
    EDITOR_FONT_SIZE_MIN,
    EDITOR_FONT_SIZE_MAX,
    EDITOR_FONT_SIZE_STEP,
    LINE_HEIGHT_KEY,
    LINE_HEIGHT_DEFAULT,
    FONT_FAMILY_KEY,
    FONT_FAMILY_OPTIONS,
    CODE_FONT_FAMILY_KEY,
    BOLD_COLOR_KEY,
    getBoldColorOptions,
    normalizeBoldColorValue,
    PAGE_WIDTH_KEY,
    PAGE_WIDTH_DEFAULT,
    PAGE_WIDTH_OPTIONS,
    IMAGE_MAX_WIDTH_KEY,
    IMAGE_MAX_HEIGHT_KEY,
    IMAGE_MAX_WIDTH_DEFAULT,
    IMAGE_MAX_HEIGHT_DEFAULT,
    CODE_BLOCK_MAX_HEIGHT_KEY,
    CODE_BLOCK_MAX_HEIGHT_DEFAULT,
    CODE_BLOCK_MAX_HEIGHT_OPTIONS,
    TYPEWRITER_MODE_KEY,
} from "../util/globalLocalStorageSettings";
import { getCodeFontFamilyOptions } from "../util/fontFamilyOptions";

export const SETTINGS_PANEL_CLASS = "vditor-settings-panel";

const EDIT_MODES = [
    { id: "wysiwyg", label: "Visual" },
    { id: "ir", label: "Source" },
] as const;

const buildEditModeSegmentedHTML = (currentMode: string) => {
    let html = `<div class="${SETTINGS_PANEL_CLASS}__segmented" role="group">`;
    for (const mode of EDIT_MODES) {
        const isCurrent = mode.id === currentMode;
        html += `<button type="button" class="${SETTINGS_PANEL_CLASS}__segment${isCurrent ? ` ${SETTINGS_PANEL_CLASS}__segment--current` : ""}" data-mode="${mode.id}" aria-pressed="${isCurrent}">${mode.label}</button>`;
    }
    html += "</div>";
    return html;
};

const buildFontSizeStepperHTML = (key: string, label: string, value: number, step: number) =>
    `<div class="${SETTINGS_PANEL_CLASS}__stepper-row" data-font-key="${key}">
        <span class="${SETTINGS_PANEL_CLASS}__stepper-label">${label}</span>
        <div class="${SETTINGS_PANEL_CLASS}__stepper">
            <button type="button" class="${SETTINGS_PANEL_CLASS}__stepper-btn" data-step="-${step}">−</button>
            <span class="${SETTINGS_PANEL_CLASS}__stepper-value" data-font-value>${value}px</span>
            <button type="button" class="${SETTINGS_PANEL_CLASS}__stepper-btn" data-step="${step}">+</button>
        </div>
    </div>`;

const buildImageStepperHTML = (key: string, label: string, value: number, unit: string) =>
    `<div class="${SETTINGS_PANEL_CLASS}__stepper-row" data-img-key="${key}">
        <span class="${SETTINGS_PANEL_CLASS}__stepper-label">${label}</span>
        <div class="${SETTINGS_PANEL_CLASS}__stepper">
            <button type="button" class="${SETTINGS_PANEL_CLASS}__stepper-btn" data-img-step="-5">−</button>
            <span class="${SETTINGS_PANEL_CLASS}__stepper-value" data-img-value>${value}${unit}</span>
            <button type="button" class="${SETTINGS_PANEL_CLASS}__stepper-btn" data-img-step="5">+</button>
        </div>
    </div>`;

const buildLineHeightStepperHTML = (value: number) =>
    `<div class="${SETTINGS_PANEL_CLASS}__stepper-row" data-lh-key>
        <span class="${SETTINGS_PANEL_CLASS}__stepper-label">Line Height</span>
        <div class="${SETTINGS_PANEL_CLASS}__stepper">
            <button type="button" class="${SETTINGS_PANEL_CLASS}__stepper-btn" data-lh-step="-0.1">−</button>
            <input type="text" class="${SETTINGS_PANEL_CLASS}__stepper-input" data-lh-value value="${value.toFixed(1)}">
            <button type="button" class="${SETTINGS_PANEL_CLASS}__stepper-btn" data-lh-step="0.1">+</button>
        </div>
    </div>`;

const buildDropdownHTML = (key: string, label: string, options: readonly { label: string; value: string }[], currentValue: string) => {
    const current = options.find(o => o.value === currentValue);
    const displayLabel = current?.label ?? currentValue;
    return `<div class="${SETTINGS_PANEL_CLASS}__dropdown-row">
        <span class="${SETTINGS_PANEL_CLASS}__dropdown-label">${label}</span>
        <button type="button" class="${SETTINGS_PANEL_CLASS}__dropdown-trigger" data-dropdown-trigger data-dropdown-key="${key}">
            <span class="${SETTINGS_PANEL_CLASS}__dropdown-value">${displayLabel}</span>
            <span class="codicon codicon-chevron-down ${SETTINGS_PANEL_CLASS}__dropdown-chevron" aria-hidden="true"></span>
        </button>
    </div>`;
};

const buildToggleHTML = (key: string, label: string, checked: boolean) =>
    `<div class="${SETTINGS_PANEL_CLASS}__toggle-row">
        <span class="${SETTINGS_PANEL_CLASS}__toggle-label">${label}</span>
        <button type="button" class="${SETTINGS_PANEL_CLASS}__toggle${checked ? ` ${SETTINGS_PANEL_CLASS}__toggle--on` : ""}" data-toggle-trigger data-toggle-key="${key}" role="switch" aria-checked="${checked}"></button>
    </div>`;

const parsePxValue = (value: string): number | undefined => {
    const match = value.trim().match(/^(\d+(?:\.\d+)?)px$/i);
    if (!match) {
        return undefined;
    }
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const resolveDisplayedFontSize = (vditor: IVditor, key: string, fallback: number): number => {
    if (key === UI_FONT_SIZE_KEY) {
        const stored = getGlobalLocalStorageSetting<number>(key);
        if (stored !== undefined) return stored;
        return parsePxValue(getComputedStyle(vditor.element).getPropertyValue("--ui-font-size")) ?? fallback;
    }

    if (vditor.options.editorFontSize !== undefined) {
        return vditor.options.editorFontSize;
    }

    const content = vditor.element.querySelector<HTMLElement>(".vditor-ir")
        || vditor.element.querySelector<HTMLElement>(".vditor-wysiwyg")
        || vditor.element;
    return parsePxValue(getComputedStyle(vditor.element).getPropertyValue("--editor-font-size"))
        ?? parsePxValue(getComputedStyle(content).fontSize)
        ?? fallback;
};

export const buildSettingsFooterHTML = () => {
    const i18n = window.VditorI18n;
    return `<div class="${SETTINGS_PANEL_CLASS}__footer">
            <button type="button" class="${SETTINGS_PANEL_CLASS}__footer-btn ${SETTINGS_PANEL_CLASS}__footer-btn--edit" data-edit-settings title="${i18n.settingsEditFile ?? i18n.edit}">
                <span class="codicon codicon-edit" aria-hidden="true"></span>
                <span>${i18n.settingsEditFile ?? i18n.edit}</span>
            </button>
            <button type="button" class="${SETTINGS_PANEL_CLASS}__footer-btn ${SETTINGS_PANEL_CLASS}__footer-btn--reset" data-reset-settings title="${i18n.settingsReset ?? 'Reset'}">
                <span class="codicon codicon-discard" aria-hidden="true"></span>
                <span>${i18n.settingsReset ?? 'Reset'}</span>
            </button>
        </div>`;
};

export const buildSettingsPanelHTML = (vditor: IVditor) => {
    const i18n = window.VditorI18n;
    const uiSize = resolveDisplayedFontSize(vditor, UI_FONT_SIZE_KEY, UI_FONT_SIZE_DEFAULT);
    const editorSize = resolveDisplayedFontSize(vditor, EDITOR_FONT_SIZE_KEY, EDITOR_FONT_SIZE_DEFAULT);
    const lineHeight = getGlobalLocalStorageSetting<number>(LINE_HEIGHT_KEY, LINE_HEIGHT_DEFAULT);
    const fontFamily = getGlobalLocalStorageSetting<string>(FONT_FAMILY_KEY, FONT_FAMILY_OPTIONS[0].value);
    const codeFontFamily = getGlobalLocalStorageSetting<string>(CODE_FONT_FAMILY_KEY, "inherit");
    const boldColor = normalizeBoldColorValue(getGlobalLocalStorageSetting<string>(BOLD_COLOR_KEY));
    const pageWidth = getGlobalLocalStorageSetting<string>(PAGE_WIDTH_KEY, PAGE_WIDTH_DEFAULT) ?? PAGE_WIDTH_DEFAULT;
    const imgMaxWidth = getGlobalLocalStorageSetting<number>(IMAGE_MAX_WIDTH_KEY, IMAGE_MAX_WIDTH_DEFAULT);
    const imgMaxHeight = getGlobalLocalStorageSetting<number>(IMAGE_MAX_HEIGHT_KEY, IMAGE_MAX_HEIGHT_DEFAULT);
    const codeBlockMaxHeight = getGlobalLocalStorageSetting<string>(CODE_BLOCK_MAX_HEIGHT_KEY, CODE_BLOCK_MAX_HEIGHT_DEFAULT) ?? CODE_BLOCK_MAX_HEIGHT_DEFAULT;
    const typewriterMode = getGlobalLocalStorageSetting<boolean>(TYPEWRITER_MODE_KEY, false) === true;
    return `<div class="${SETTINGS_PANEL_CLASS}">
        <div class="${SETTINGS_PANEL_CLASS}__section">
            <div class="${SETTINGS_PANEL_CLASS}__title">Edit Mode</div>
            ${buildEditModeSegmentedHTML(vditor.currentMode)}
        </div>
        <div class="${SETTINGS_PANEL_CLASS}__section">
            <div class="${SETTINGS_PANEL_CLASS}__title">Font Size</div>
            <div class="${SETTINGS_PANEL_CLASS}__group">
                ${buildFontSizeStepperHTML(UI_FONT_SIZE_KEY, "UI", uiSize, 1)}
                ${buildFontSizeStepperHTML(EDITOR_FONT_SIZE_KEY, i18n.editorFontSize ?? "Editor Font Size", editorSize, EDITOR_FONT_SIZE_STEP)}
            </div>
        </div>
        <div class="${SETTINGS_PANEL_CLASS}__section">
            <div class="${SETTINGS_PANEL_CLASS}__title">Typography</div>
            <div class="${SETTINGS_PANEL_CLASS}__group">
                ${buildDropdownHTML(FONT_FAMILY_KEY, "Font", FONT_FAMILY_OPTIONS, fontFamily)}
                ${buildDropdownHTML(BOLD_COLOR_KEY, i18n.boldColor ?? "Bold Color", getBoldColorOptions(), boldColor)}
                ${buildDropdownHTML(PAGE_WIDTH_KEY, i18n.pageWidth, PAGE_WIDTH_OPTIONS, pageWidth)}
                ${buildLineHeightStepperHTML(lineHeight)}
                ${buildToggleHTML(TYPEWRITER_MODE_KEY, i18n.typewriterMode ?? "Typewriter Mode", typewriterMode)}
            </div>
        </div>
        <div class="${SETTINGS_PANEL_CLASS}__section">
            <div class="${SETTINGS_PANEL_CLASS}__title">CodeMirror</div>
            <div class="${SETTINGS_PANEL_CLASS}__group">
                ${buildDropdownHTML(CODE_FONT_FAMILY_KEY, "Font", getCodeFontFamilyOptions(), codeFontFamily)}
                ${buildDropdownHTML(CODE_BLOCK_MAX_HEIGHT_KEY, i18n.codeBlockHeight, CODE_BLOCK_MAX_HEIGHT_OPTIONS, codeBlockMaxHeight)}
            </div>
        </div>
        <div class="${SETTINGS_PANEL_CLASS}__section">
            <div class="${SETTINGS_PANEL_CLASS}__title">${i18n.imageSize}</div>
            <div class="${SETTINGS_PANEL_CLASS}__group">
                ${buildImageStepperHTML(IMAGE_MAX_WIDTH_KEY, i18n.imageMaxWidth, imgMaxWidth, "%")}
                ${buildImageStepperHTML(IMAGE_MAX_HEIGHT_KEY, i18n.imageMaxHeight, imgMaxHeight, "vh")}
            </div>
        </div>
        ${buildSettingsFooterHTML()}
    </div>`;
};

export const refreshSettingsPanel = (panelElement: HTMLElement, vditor: IVditor) => {
    for (const button of panelElement.querySelectorAll(`.${SETTINGS_PANEL_CLASS}__segment[data-mode]`)) {
        const mode = button.getAttribute("data-mode") || "";
        const isCurrent = mode === vditor.currentMode;
        button.classList.toggle(`${SETTINGS_PANEL_CLASS}__segment--current`, isCurrent);
        button.setAttribute("aria-pressed", String(isCurrent));
    }
};

export const refreshSettingsToolbarPanel = (vditor: IVditor) => {
    const settingsItem = vditor.toolbar.elements.settings;
    if (!settingsItem) return;
    const panelElement = settingsItem.querySelector(".vditor-hint") as HTMLElement | null;
    if (!panelElement || panelElement.style.display !== "block") return;
    refreshSettingsPanel(panelElement, vditor);
};
