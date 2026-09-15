/**
 * ADR 0009 semantic editing transactions.
 * One user intent → one Markdown commit / one undo unit / one dirty.
 * Presentation-only work never enters history or pulses dirty.
 * Focus does not own Ctrl+Z (document stack does).
 */
import { getMarkdown } from "../markdown/getMarkdown";
import { processAfterRender, recordHistory as recordIrHistory } from "../ir/process";
import { afterRenderEvent, recordHistory as recordWysiwygHistory } from "../wysiwyg/afterRenderEvent";
import { clearHistoryInputBuffer } from "./historyInputBufferState";
import { clearPendingHistoryTimeout } from "./instantHistory";
import { shouldSkipCommit } from "./editTransactionDedupe";
import { clearAuthoredIntent, noteAuthoredIntent, noteAuthoredSource } from "./writeBackFidelity";
import {
    beginPresentationOnly,
    endPresentationOnly,
    getEditTransactionSession,
    getLastCommitFingerprint,
    invalidateCommitFingerprint,
    isPresentationOnlyActive,
    noteCommittedFingerprint,
    type EditIntentKind,
} from "./editTransactionState";

export type { EditIntentKind };

export type CommitOptions = {
    enableHint?: boolean;
    /** default true for authored */
    enableInput?: boolean;
    /** default true for authored */
    enableAddUndoStack?: boolean;
    intent?: EditIntentKind;
};

export const fingerprintDocument = (vditor: IVditor): string => {
    try {
        return getMarkdown(vditor);
    } catch {
        const mode = vditor.currentMode;
        if (mode === "wysiwyg" || mode === "ir") {
            return vditor[mode]?.element?.innerHTML ?? "";
        }
        return "";
    }
};

export const clearPendingHistory = (vditor: IVditor) => {
    clearPendingHistoryTimeout(vditor);
    clearHistoryInputBuffer(vditor);
    const session = getEditTransactionSession(vditor);
    if (session.scheduledTimer != null) {
        window.clearTimeout(session.scheduledTimer);
        session.scheduledTimer = undefined;
    }
};

export const wouldBeNoopCommit = (vditor: IVditor): boolean => {
    return shouldSkipCommit(getLastCommitFingerprint(vditor), fingerprintDocument(vditor));
};

export const runPresentationOnly = (vditor: IVditor, fn?: () => void): void => {
    beginPresentationOnly(vditor);
    try {
        fn?.();
    } finally {
        endPresentationOnly(vditor);
    }
};

/**
 * Canonical authored mutation commit: one intent → one stack entry + one dirty pulse.
 * Identical consecutive snapshots are skipped (CM delay + blur double-flush guard).
 */
export const commitAuthoredEdit = (vditor: IVditor, options: CommitOptions = {}): boolean => {
    if (isPresentationOnlyActive(vditor)) {
        return false;
    }
    if (vditor.currentMode !== "wysiwyg" && vditor.currentMode !== "ir") {
        return false;
    }

    const enableAddUndoStack = options.enableAddUndoStack !== false;
    const enableInput = options.enableInput !== false;
    const enableHint = options.enableHint === true;

    if (enableInput) {
        noteAuthoredIntent(vditor);
    }

    clearPendingHistory(vditor);

    if (enableAddUndoStack && wouldBeNoopCommit(vditor)) {
        clearAuthoredIntent(vditor);
        return false;
    }

    const recordOptions = {
        enableAddUndoStack,
        enableHint,
        enableInput,
    };

    if (vditor.currentMode === "wysiwyg") {
        recordWysiwygHistory(vditor, recordOptions);
    } else {
        recordIrHistory(vditor, recordOptions);
    }

    const committedSource = fingerprintDocument(vditor);
    if (enableInput) {
        noteAuthoredSource(vditor, committedSource);
    }
    if (enableAddUndoStack) {
        noteCommittedFingerprint(vditor, committedSource);
    }
    return true;
};

/** Debounced authored commit (CM typing). Blur/exit should flush via flushScheduledAuthoredEdit. */
export const scheduleAuthoredEdit = (vditor: IVditor, options: CommitOptions = {}): void => {
    if (isPresentationOnlyActive(vditor)) {
        return;
    }
    const session = getEditTransactionSession(vditor);
    if (session.scheduledTimer != null) {
        window.clearTimeout(session.scheduledTimer);
    }
    session.scheduledOptions = options;
    const delay = typeof vditor.options.undoDelay === "number" ? vditor.options.undoDelay : 0;
    session.scheduledTimer = window.setTimeout(() => {
        session.scheduledTimer = undefined;
        const opts = session.scheduledOptions ?? options;
        session.scheduledOptions = undefined;
        commitAuthoredEdit(vditor, opts);
    }, delay);
};

/** Flush pending scheduled commit immediately (or commit with overrides). */
export const flushScheduledAuthoredEdit = (vditor: IVditor, options?: CommitOptions): boolean => {
    const session = getEditTransactionSession(vditor);
    const opts = options ?? session.scheduledOptions ?? { intent: "code" as EditIntentKind };
    if (session.scheduledTimer != null) {
        window.clearTimeout(session.scheduledTimer);
        session.scheduledTimer = undefined;
    }
    session.scheduledOptions = undefined;
    return commitAuthoredEdit(vditor, opts);
};

export { invalidateCommitFingerprint, isPresentationOnlyActive, noteCommittedFingerprint };
