const inlineMdHTMLInPlain = /<(mark|kbd|u|span|del|sub|sup)\b[^>]*>[\s\S]*?<\/\1>/i;

export const isMarkdownLikePlain = (text: string): boolean => {
    const trimmed = text.trim();
    if (!trimmed) {
        return false;
    }
    if (/^#{1,6}\s/m.test(trimmed)) {
        return true;
    }
    if (/^\s*[-*+]\s/m.test(trimmed)) {
        return true;
    }
    if (/^\s*\d+\.\s/m.test(trimmed)) {
        return true;
    }
    if (/\[\[[^\]]+\]\]/.test(trimmed)) {
        return true;
    }
    if (/^\s*\|?.+\|\s*$/m.test(trimmed) &&
        /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/m.test(trimmed)) {
        return true;
    }
    if (inlineMdHTMLInPlain.test(trimmed)) {
        return true;
    }
    return false;
};

export const isIdeCodeHtml = (html: string): boolean => {
    if (!html.trim()) {
        return false;
    }
    if (html.indexOf("\n ") === 0) {
        return true;
    }
    const tempElement = document.createElement("div");
    tempElement.innerHTML = html;
    if (tempElement.childElementCount === 1) {
        const only = tempElement.lastElementChild as HTMLElement;
        if (only.style?.fontFamily?.indexOf("monospace") > -1) {
            return true;
        }
    }
    const pres = tempElement.querySelectorAll("pre");
    if (tempElement.childElementCount === 1 && pres.length === 1) {
        const pre = pres[0];
        if (pre.className !== "vditor-wysiwyg" && pre.className !== "vditor-sv") {
            return true;
        }
    }
    if (tempElement.childElementCount === 1 && tempElement.firstElementChild?.tagName === "TABLE"
        && tempElement.querySelector(".line-number") && tempElement.querySelector(".line-content")) {
        return true;
    }
    return false;
};
