type OutlineI18n = {
    outline?: string;
    outlineHeader?: string;
};

export const resolveOutlineHeader = (i18n: OutlineI18n): string =>
    i18n.outlineHeader || i18n.outline || "On this page";
