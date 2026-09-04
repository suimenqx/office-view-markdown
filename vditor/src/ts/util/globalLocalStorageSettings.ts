import { accessLocalStorage } from "./compatibility";

const GLOBAL_SETTINGS_STORAGE_KEY = "vditor-global-settings";

type GlobalLocalStorageSettings = {
    outlineEnable?: boolean;
    outlineWidth?: number;
    [key: string]: boolean | number | string | undefined;
};

const readGlobalSettings = (): GlobalLocalStorageSettings => {
    if (!accessLocalStorage()) {
        return {};
    }
    try {
        const raw = localStorage.getItem(GLOBAL_SETTINGS_STORAGE_KEY);
        if (!raw) {
            return {};
        }
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};

const writeGlobalSettings = (settings: GlobalLocalStorageSettings) => {
    if (!accessLocalStorage()) {
        return;
    }
    try {
        localStorage.setItem(GLOBAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // ignore
    }
};

export const getGlobalLocalStorageSetting = <T extends GlobalLocalStorageSettings[keyof GlobalLocalStorageSettings]>(
    key: string,
    fallback?: T,
): T | undefined => {
    const settings = readGlobalSettings();
    const value = settings[key];
    return value === undefined ? fallback : value as T;
};

export const UI_FONT_SIZE_KEY = "uiFontSize";
export const EDITOR_FONT_SIZE_KEY = "editorFontSize";
export const UI_FONT_SIZE_DEFAULT = 13;
export const EDITOR_FONT_SIZE_DEFAULT = 13;
export const FONT_SIZE_MIN = 10;
export const FONT_SIZE_MAX = 24;
export const EDITOR_FONT_SIZE_MIN = 12;
export const EDITOR_FONT_SIZE_MAX = 28;
export const EDITOR_FONT_SIZE_STEP = 2;

/** Clamp host-owned Editor Font Size changes at the Vditor settings seam. */
export const stepEditorFontSize = (current: number, delta: number): number =>
    Math.min(EDITOR_FONT_SIZE_MAX, Math.max(EDITOR_FONT_SIZE_MIN, current + delta));

export const LINE_HEIGHT_KEY = "editorLineHeight";
export const FONT_FAMILY_KEY = "editorFontFamily";
export const CODE_FONT_FAMILY_KEY = "codeFontFamily";
export const BOLD_COLOR_KEY = "boldColor";
export const HTML_EDITOR_LINE_WRAP_KEY = "htmlEditorLineWrap";
export const TYPEWRITER_MODE_KEY = "typewriterMode";
export const LAST_NON_AUTO_EDITOR_THEME_KEY = "lastNonAutoEditorTheme";
export const LAST_LIGHT_EDITOR_THEME_KEY = "lastLightEditorTheme";
export const LAST_DARK_EDITOR_THEME_KEY = "lastDarkEditorTheme";

export const LINE_HEIGHT_MIN = 1.0;
export const LINE_HEIGHT_MAX = 3.0;
export const LINE_HEIGHT_DEFAULT = 1.7;

export const FONT_FAMILY_OPTIONS = [
    { label: "Default", value: "inherit" },
    { label: "Humanist", value: "Optima, Candara, 'Gill Sans', sans-serif" },
    { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
    { label: "Old Style", value: "Palatino, 'Palatino Linotype', 'Book Antiqua', serif" },
    { label: "Garamond", value: "Garamond, 'EB Garamond', 'Cormorant Garamond', serif" },
    { label: "Charter", value: "Charter, 'Bitstream Charter', 'Sitka Text', serif" },
    { label: "Slab Serif", value: "Rockwell, Georgia, serif" },
    { label: "Narrow", value: "'Arial Narrow', 'Liberation Sans Narrow', sans-serif" },
    { label: "Mono", value: "Menlo, Monaco, Consolas, 'Liberation Mono', monospace" },
    { label: "JetBrains Mono", value: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace" },
    { label: "Courier", value: "'Courier New', Courier, monospace" },
] as const;

export const BOLD_COLOR_DEFAULT = "color-mix(in srgb, var(--front-color, #b9b9b9) 80%, var(--chart-yellow, #9a6700) 20%)";
export const BOLD_COLOR_DEFAULT_OPTION = "default";
export const BOLD_COLOR_PLAIN = "plain";

const BOLD_COLOR_ACCENT_OPTIONS = [
    { i18nKey: "boldColorAccent", value: "var(--link-color, #0550ae)" },
    { i18nKey: "boldColorRed", value: "var(--error-color, #cf222e)" },
    { i18nKey: "boldColorOrange", value: "#bc4c00" },
    { i18nKey: "boldColorPurple", value: "#8250df" },
    { i18nKey: "boldColorTeal", value: "#1a7f64" },
] as const;

export const normalizeBoldColorValue = (value: string | undefined): string => {
    if (!value || value === "inherit") {
        return BOLD_COLOR_DEFAULT_OPTION;
    }
    return value;
};

export const getBoldColorOptions = (): { label: string; value: string }[] => {
    const i18n = window.VditorI18n;
    return [
        { label: i18n.boldColorDefault ?? "Default", value: BOLD_COLOR_DEFAULT_OPTION },
        { label: i18n.boldColorPlain ?? "Plain", value: BOLD_COLOR_PLAIN },
        ...BOLD_COLOR_ACCENT_OPTIONS.map((option) => ({
            label: i18n[option.i18nKey] ?? option.i18nKey,
            value: option.value,
        })),
    ];
};

export const applyBoldColorSetting = (vditorElement: HTMLElement, value: string | undefined) => {
    const normalized = normalizeBoldColorValue(value);
    if (normalized === BOLD_COLOR_DEFAULT_OPTION) {
        vditorElement.style.removeProperty("--bold-color");
        return;
    }
    if (normalized === BOLD_COLOR_PLAIN) {
        vditorElement.style.setProperty("--bold-color", "var(--textarea-text-color, inherit)");
        return;
    }
    vditorElement.style.setProperty("--bold-color", normalized);
};

export const PAGE_WIDTH_KEY = "pageWidth";
export const PAGE_WIDTH_DEFAULT = "100%";

export const PAGE_WIDTH_OPTIONS = [
    { label: "100%", value: "100%" },
    { label: "A4 (210mm)", value: "210mm" },
    { label: "A5 (148mm)", value: "148mm" },
    { label: "B5 (176mm)", value: "176mm" },
    { label: "Letter (8.5in)", value: "8.5in" },
    { label: "768px", value: "768px" },
    { label: "960px", value: "960px" },
] as const;

export const CODE_BLOCK_MAX_HEIGHT_KEY = "codeBlockMaxHeight";
export const CODE_BLOCK_MAX_HEIGHT_DEFAULT = "none";

export const CODE_BLOCK_MAX_HEIGHT_OPTIONS = [
    { label: "300px", value: "300px" },
    { label: "Default", value: "none" },
    { label: "400px", value: "400px" },
    { label: "600px", value: "600px" },
    { label: "800px", value: "800px" },
] as const;

export const IMAGE_MAX_WIDTH_KEY = "imageMaxWidth";
export const IMAGE_MAX_HEIGHT_KEY = "imageMaxHeight";
export const IMAGE_MAX_WIDTH_DEFAULT = 100;
export const IMAGE_MAX_HEIGHT_DEFAULT = 70;
export const IMAGE_MAX_WIDTH_MIN = 10;
export const IMAGE_MAX_WIDTH_MAX = 100;
export const IMAGE_MAX_HEIGHT_MIN = 10;
export const IMAGE_MAX_HEIGHT_MAX = 100;

export type ViewerSettingsExport = {
    globalSettings: GlobalLocalStorageSettings;
};

let settingsSyncEnabled = false;
let suppressSettingsNotify = false;
let onViewerSettingsChange: ((settings: ViewerSettingsExport) => void) | undefined;

export const enableViewerSettingsSync = (enabled: boolean) => {
    settingsSyncEnabled = enabled;
};

export const isViewerSettingsSyncEnabled = () => settingsSyncEnabled;

export const setOnViewerSettingsChange = (
    callback: ((settings: ViewerSettingsExport) => void) | undefined,
) => {
    onViewerSettingsChange = callback;
};

export const exportViewerSettings = (): ViewerSettingsExport => ({
    globalSettings: readGlobalSettings(),
});

const notifyViewerSettingsChange = () => {
    if (suppressSettingsNotify || !settingsSyncEnabled || !onViewerSettingsChange) {
        return;
    }
    onViewerSettingsChange(exportViewerSettings());
};

export const importViewerSettings = (data: ViewerSettingsExport | null | undefined) => {
    if (!data || typeof data !== "object") {
        return;
    }
    suppressSettingsNotify = true;
    try {
        writeGlobalSettings({ ...(data.globalSettings ?? {}) });
    } finally {
        suppressSettingsNotify = false;
    }
};

export const applyPageWidthSetting = (vditorElement: HTMLElement, pageWidth?: string) => {
    if (pageWidth !== undefined) {
        vditorElement.style.setProperty("--vditor-page-width", pageWidth);
        vditorElement.setAttribute("data-page-width-mode", "fixed");
        return;
    }
    vditorElement.style.removeProperty("--vditor-page-width");
    vditorElement.setAttribute("data-page-width-mode", "fluid");
};

export const applyEditorSettings = (vditorElement: HTMLElement) => {
    const uiSize = getGlobalLocalStorageSetting<number>(UI_FONT_SIZE_KEY);
    const editorSize = getGlobalLocalStorageSetting<number>(EDITOR_FONT_SIZE_KEY);
    const lineHeight = getGlobalLocalStorageSetting<number>(LINE_HEIGHT_KEY);
    const fontFamily = getGlobalLocalStorageSetting<string>(FONT_FAMILY_KEY);
    const codeFontFamily = getGlobalLocalStorageSetting<string>(CODE_FONT_FAMILY_KEY);
    const boldColor = getGlobalLocalStorageSetting<string>(BOLD_COLOR_KEY);
    const pageWidth = getGlobalLocalStorageSetting<string>(PAGE_WIDTH_KEY);
    const imgMaxWidth = getGlobalLocalStorageSetting<number>(IMAGE_MAX_WIDTH_KEY);
    const imgMaxHeight = getGlobalLocalStorageSetting<number>(IMAGE_MAX_HEIGHT_KEY);
    if (uiSize !== undefined) vditorElement.style.setProperty("--ui-font-size", `${uiSize}px`);
    if (editorSize !== undefined) vditorElement.style.setProperty("--editor-font-size", `${editorSize}px`);
    if (lineHeight !== undefined) vditorElement.style.setProperty("--editor-line-height", String(lineHeight));
    if (fontFamily !== undefined) vditorElement.style.setProperty("--editor-font-family", fontFamily);
    if (codeFontFamily !== undefined && codeFontFamily !== "inherit") {
        vditorElement.style.setProperty("--code-font-family", codeFontFamily);
    } else if (codeFontFamily === "inherit") {
        vditorElement.style.removeProperty("--code-font-family");
    }
    applyBoldColorSetting(vditorElement, boldColor);
    applyPageWidthSetting(vditorElement, pageWidth);
    if (imgMaxWidth !== undefined) vditorElement.style.setProperty("--vditor-image-max-width", `${imgMaxWidth}%`);
    if (imgMaxHeight !== undefined) vditorElement.style.setProperty("--vditor-image-max-height", `${imgMaxHeight}vh`);
    const codeBlockMaxHeight = getGlobalLocalStorageSetting<string>(CODE_BLOCK_MAX_HEIGHT_KEY);
    if (codeBlockMaxHeight !== undefined && codeBlockMaxHeight !== CODE_BLOCK_MAX_HEIGHT_DEFAULT) {
        vditorElement.style.setProperty("--cm-block-max-height", codeBlockMaxHeight);
    } else {
        vditorElement.style.removeProperty("--cm-block-max-height");
    }
    applyTypewriterModeClass(vditorElement);
};

export const applyTypewriterModeClass = (vditorElement: HTMLElement, enabled?: boolean) => {
    const on = enabled ?? getGlobalLocalStorageSetting<boolean>(TYPEWRITER_MODE_KEY, false) === true;
    vditorElement.classList.toggle("vditor--typewriter", on);
};

/** @deprecated use applyEditorSettings */
export const applyFontSizes = applyEditorSettings;

export const resetGlobalSettings = () => {
    if (!accessLocalStorage()) return;
    try {
        localStorage.removeItem(GLOBAL_SETTINGS_STORAGE_KEY);
    } catch { /* ignore */ }
    notifyViewerSettingsChange();
};

export const setGlobalLocalStorageSetting = (
    key: string,
    value: GlobalLocalStorageSettings[keyof GlobalLocalStorageSettings],
) => {
    const settings = readGlobalSettings();
    if (value === undefined) {
        delete settings[key];
    } else {
        settings[key] = value;
    }
    writeGlobalSettings(settings);
    notifyViewerSettingsChange();
};
