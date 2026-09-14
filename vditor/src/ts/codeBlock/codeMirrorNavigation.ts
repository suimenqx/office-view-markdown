import {hasClosestBlock} from "../util/hasClosest";
import {isCtrl} from "../util/compatibility";
import {getSelectPosition} from "../util/selection";
import {resolveDocumentBoundaryTarget} from "../util/documentPosition";
import {
    focusCodeMirrorAtDocumentPosition,
    getCodeMirrorView,
    isCmCodeBlock,
    isInsideCodeMirror,
    isSpecialPreviewBlock,
} from "./codeMirrorManager";

/** 从相邻块用 ↑/↓ 进入 CodeMirror */
export const tryFocusAdjacentCodeMirror = (vditor: IVditor, event: KeyboardEvent, range: Range) => {
    if (isCtrl(event) || event.altKey || event.shiftKey || isInsideCodeMirror(event.target)) {
        return false;
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown" && event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") {
        return false;
    }

    const blockElement = hasClosestBlock(range.startContainer);
    if (!blockElement) {
        return false;
    }

    const editor = vditor[vditor.currentMode].element as HTMLElement;
    const text = blockElement.textContent || "";
    const position = getSelectPosition(blockElement, editor, range);

    const logicalBlockStart = text.startsWith("\u200b") ? 1 : 0;
    const atBlockStart = position.start === 0 || position.start === logicalBlockStart;
    const atBlockEnd = position.start >= text.trimRight().length;
    const firstLine = text.substr(0, position.start).indexOf("\n") === -1;
    const lastLine = text.substr(position.start).indexOf("\n") === -1;
    const boundaryStart = event.key === "ArrowUp" ? firstLine : atBlockStart;
    const boundaryEnd = event.key === "ArrowDown" ? lastLine : atBlockEnd;
    const previousElement = blockElement.previousElementSibling as HTMLElement | null;
    const nextElement = blockElement.nextElementSibling as HTMLElement | null;
    const target = resolveDocumentBoundaryTarget(
        event.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "Home" | "End",
        boundaryStart,
        boundaryEnd,
        !!previousElement,
        !!nextElement,
    );
    if (target === "previous" && previousElement &&
        (isCmCodeBlock(previousElement) || isSpecialPreviewBlock(previousElement))) {
        const view = getCodeMirrorView(previousElement);
        const length = view?.state.doc.length ?? previousElement.querySelector("pre code")?.textContent?.length ?? 0;
        focusCodeMirrorAtDocumentPosition(previousElement, length, length, vditor);
        event.preventDefault();
        return true;
    }
    if (target === "next" && nextElement &&
        (isCmCodeBlock(nextElement) || isSpecialPreviewBlock(nextElement))) {
        focusCodeMirrorAtDocumentPosition(nextElement, 0, 0, vditor);
        event.preventDefault();
        return true;
    }

    return false;
};
