import { isIdeCodeHtml, isMarkdownLikePlain } from "./processCode";

const inlineHTMLTagInPlain = /<\/[a-zA-Z][\w:-]*>|<[a-zA-Z][\w:-]*(?:\s[^>]*)?\/?>/;

/** Rich clipboard markup that the editor intentionally drops during paste. */
const lossyHTMLPaste = /(?:\sstyle\s*=|\s(?:data-mso|mso-[\w-]+)\s*=|<(?:style|script|meta|link|iframe|object|embed|canvas|form|input|select|textarea|font|center)\b|\s(?:bgcolor|valign|width|height)\s*=)/i;

export const isPasteHTMLDegraded = (html: string): boolean => {
    return lossyHTMLPaste.test(html);
};

const decodeHTMLAttribute = (value: string): string => value
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&");

const isBreakSourceSpan = (openingTag: string): boolean => {
    if (!/\bdata-type=["']html-inline["']/i.test(openingTag)) {
        return false;
    }
    const source = openingTag.match(/\bdata-md-source=["']([^"']+)["']/i);
    return !!source && /^\s*<br\s*\/?\s*>\s*$/i.test(decodeHTMLAttribute(source[1]));
};

/**
 * Lute represents pasted table-cell <br> nodes as readonly HTML-inline spans.
 * Those spans are presentation-only and disappear during VditorDOM2Md. Turn
 * only those generated spans back into editable breaks so model/export keeps
 * the in-cell newline. Non-table HTML inline spans are intentionally untouched.
 */
export const restoreTableCellBreaks = (vditorDOM: string): string => {
    const replaceBreakSpans = (cellHTML: string): string => {
        const nestedSpan = /<span\b(?=[^>]*\bdata-type=["']html-inline["'])(?=[^>]*\bdata-md-source=["'][^"']+["'])[^>]*>[\s\S]*?<\/span>\s*<\/span>/gi;
        const simpleSpan = /<span\b(?=[^>]*\bdata-type=["']html-inline["'])(?=[^>]*\bdata-md-source=["'][^"']+["'])[^>]*>[\s\S]*?<\/span>/gi;
        const replace = (match: string): string => {
            const openingTag = match.match(/^<span\b[^>]*>/i)?.[0] || "";
            return isBreakSourceSpan(openingTag) ? '<br data-vditor-table-break="true">' : match;
        };
        return cellHTML.replace(nestedSpan, replace).replace(simpleSpan, replace);
    };

    return vditorDOM.replace(/(<t[dh]\b[^>]*>)([\s\S]*?)(<\/t[dh]>)/gi,
        (_match, openingTag: string, cellHTML: string, closingTag: string) =>
            openingTag + replaceBreakSpans(cellHTML) + closingTag);
};

/**
 * 粘贴前在 HTML / plain 之间选路。
 *
 * 1. VS Code（vscode-editor-data）：以 plain 为准，HTML 仅为语法高亮壳
 * 2. plain 已含 Markdown 结构或 vditor 内联 HTML：丢弃会误导的 HTML
 * 3. 其他 IDE 代码 HTML（IntelliJ 等）：保留 HTML 供 processPasteCode 识别语言
 * 4. 其余：保留 HTML，走网页富文本路径
 */
export const routePasteClipboard = (
    textHTML: string,
    textPlain: string,
    vscodeEditorData: string,
): { textHTML: string; textPlain: string } => {
    if (vscodeEditorData) {
        return { textHTML: "", textPlain };
    }

    if (!textPlain.trim() || !textHTML.trim()) {
        return { textHTML, textPlain };
    }

    if (inlineHTMLTagInPlain.test(textPlain) || isMarkdownLikePlain(textPlain)) {
        return { textHTML: "", textPlain };
    }

    if (isIdeCodeHtml(textHTML)) {
        return { textHTML, textPlain };
    }

    return { textHTML, textPlain };
};
