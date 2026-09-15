import {buildEditorHtmlForMarkdown} from "../codeBlock/codeMirrorManager";
import {formatMs, logPerf} from "../util/log";
import {preserveAuthoredSource} from "../util/writeBackFidelity";

export const getMarkdown = (vditor: IVditor) => {
    const debug = vditor.options.debugger;
    const totalStart = debug ? performance.now() : 0;

    let stepStart = debug ? performance.now() : 0;
    const html = buildEditorHtmlForMarkdown(vditor);
    const buildHtmlMs = debug ? performance.now() - stepStart : 0;

    stepStart = debug ? performance.now() : 0;
    let markdown = "";
    if (vditor.currentMode === "wysiwyg") {
        markdown = vditor.lute.VditorDOM2Md(html);
    } else if (vditor.currentMode === "ir") {
        markdown = vditor.lute.VditorIRDOM2Md(html);
    }
    const toMarkdownMs = debug ? performance.now() - stepStart : 0;

    markdown = preserveAuthoredSource(vditor, markdown);

    logPerf(debug, "[vditor markdown] getMarkdown", {
        buildHtmlMs: formatMs(buildHtmlMs),
        toMarkdownMs: formatMs(toMarkdownMs),
        totalMs: formatMs(debug ? performance.now() - totalStart : 0),
    });

    return markdown;
};
