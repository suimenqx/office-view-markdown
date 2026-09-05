/** Normalize outline label text for hover title. */
export const normalizeOutlineItemTitle = (text: string | null | undefined): string =>
    (text || "").replace(/\s+/g, " ").trim();

/** Set native title tooltip to the full heading label when present. */
export const applyOutlineItemTitle = (item: HTMLElement, text?: string | null): void => {
    const title = normalizeOutlineItemTitle(text ?? item.textContent);
    if (title) {
        item.setAttribute("title", title);
    } else {
        item.removeAttribute("title");
    }
};
