import { commitAuthoredEdit } from "./editTransaction";
import {
    clearHistoryInputBuffer,
    historyInputBufferHasText,
    trackHistoryInputFromEvent,
    trackHistoryInputFromText,
} from "./historyInputBufferState";

export {
    clearHistoryInputBuffer,
    historyInputBufferHasText,
    trackHistoryInputFromEvent,
    trackHistoryInputFromText,
} from "./historyInputBufferState";

const defaultRecordOptions = {
    enableAddUndoStack: true,
    enableHint: false,
    enableInput: true,
};

export const flushBufferedHistory = (vditor: IVditor, options = defaultRecordOptions) => {
    return commitAuthoredEdit(vditor, {
        enableAddUndoStack: options.enableAddUndoStack,
        enableHint: options.enableHint,
        enableInput: options.enableInput,
        intent: "prose",
    });
};

export const flushBufferedHistoryOnClick = (vditor: IVditor) => {
    if (!historyInputBufferHasText(vditor)) {
        return;
    }
    flushBufferedHistory(vditor);
};

export const bindHistoryInputBufferClick = (vditor: IVditor) => {
    vditor.element.addEventListener("mousedown", () => {
        flushBufferedHistoryOnClick(vditor);
    }, true);
};
