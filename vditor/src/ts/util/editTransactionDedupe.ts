/** Testable fingerprint dedupe helper for ADR 0009 (no DOM). */
export const shouldSkipCommit = (lastFingerprint: string | undefined, nextFingerprint: string): boolean => {
    return lastFingerprint !== undefined && lastFingerprint === nextFingerprint;
};

export const nextFingerprintAfterCommit = (
    lastFingerprint: string | undefined,
    nextFingerprint: string,
    enableAddUndoStack: boolean,
): string | undefined => {
    if (!enableAddUndoStack) {
        return lastFingerprint;
    }
    if (shouldSkipCommit(lastFingerprint, nextFingerprint)) {
        return lastFingerprint;
    }
    return nextFingerprint;
};
