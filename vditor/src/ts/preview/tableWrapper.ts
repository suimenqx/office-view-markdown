const TABLE_WRAPPER_ATTR = "data-vditor-table-wrapper";
const TABLE_WRAPPER_CLASS = "vditor-table-wrapper";

/** True for a bare Markdown table or its presentation wrapper. */
export const isTableBlockElement = (element: Element | null | undefined): element is HTMLElement => {
    if (!element) {
        return false;
    }
    return element.tagName === "TABLE" || element.getAttribute(TABLE_WRAPPER_ATTR) === "true";
};

/** Resolve the editable <table> from a table block or wrapper. */
export const resolveTableElement = (element: Element): HTMLTableElement | null => {
    if (element.tagName === "TABLE") {
        return element as HTMLTableElement;
    }
    if (element.getAttribute(TABLE_WRAPPER_ATTR) === "true") {
        return element.querySelector("table");
    }
    return null;
};

const shouldWrapTable = (table: HTMLTableElement): boolean => {
    if (table.parentElement?.getAttribute(TABLE_WRAPPER_ATTR) === "true") {
        return false;
    }
    // Properties / frontmatter chrome is not a Reading Surface content table.
    if (table.closest(".vditor-properties, [data-type='yaml-front-matter']")) {
        return false;
    }
    return true;
};

/** Wrap content tables so radius + overflow clip corners reliably. */
export const enhanceTablePresentation = (root: ParentNode) => {
    root.querySelectorAll("table").forEach((table) => {
        if (!(table instanceof HTMLTableElement) || !shouldWrapTable(table)) {
            return;
        }
        const parent = table.parentElement;
        if (!parent) {
            return;
        }
        const wrapper = document.createElement("div");
        wrapper.className = TABLE_WRAPPER_CLASS;
        wrapper.setAttribute(TABLE_WRAPPER_ATTR, "true");
        if (table.getAttribute("data-block") === "0") {
            wrapper.setAttribute("data-block", "0");
            table.removeAttribute("data-block");
        }
        parent.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
};

/** Restore bare tables in the Markdown export clone. */
export const stripTablePresentationFromClone = (root: ParentNode) => {
    root.querySelectorAll(`[${TABLE_WRAPPER_ATTR}]`).forEach((wrapper) => {
        const table = wrapper.querySelector("table");
        if (table) {
            if (wrapper.getAttribute("data-block") === "0" && !table.getAttribute("data-block")) {
                table.setAttribute("data-block", "0");
            }
            wrapper.replaceWith(table);
        } else {
            wrapper.remove();
        }
    });
};
