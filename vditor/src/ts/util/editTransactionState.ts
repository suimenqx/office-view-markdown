/** ADR 0009 session state — no imports from history/render (avoids cycles). */

export type EditIntentKind = "prose" | "code" | "task" | "linkHtml" | "specialBlock" | "findReplace" | "other";

export type EditTransactionSession = {
    lastFingerprint?: string;
    presentationDepth: number;
    scheduledTimer?: number;
    scheduledOptions?: {
        enableHint?: boolean;
        enableInput?: boolean;
        enableAddUndoStack?: boolean;
        intent?: EditIntentKind;
    };
};

const sessions = new WeakMap<IVditor, EditTransactionSession>();

export const getEditTransactionSession = (vditor: IVditor): EditTransactionSession => {
    let session = sessions.get(vditor);
    if (!session) {
        session = { presentationDepth: 0 };
        sessions.set(vditor, session);
    }
    return session;
};

export const noteCommittedFingerprint = (vditor: IVditor, fingerprint: string) => {
    getEditTransactionSession(vditor).lastFingerprint = fingerprint;
};

export const getLastCommitFingerprint = (vditor: IVditor): string | undefined => {
    return getEditTransactionSession(vditor).lastFingerprint;
};

export const invalidateCommitFingerprint = (vditor: IVditor) => {
    const session = sessions.get(vditor);
    if (session) {
        delete session.lastFingerprint;
    }
};

export const isPresentationOnlyActive = (vditor: IVditor): boolean => {
    return (sessions.get(vditor)?.presentationDepth ?? 0) > 0;
};

export const beginPresentationOnly = (vditor: IVditor) => {
    getEditTransactionSession(vditor).presentationDepth++;
};

export const endPresentationOnly = (vditor: IVditor) => {
    const session = getEditTransactionSession(vditor);
    session.presentationDepth = Math.max(0, session.presentationDepth - 1);
};
