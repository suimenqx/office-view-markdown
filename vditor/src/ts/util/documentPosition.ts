/**
 * ADR 0010: the in-session logical caret/selection contract.
 *
 * This module deliberately has no editor, DOM, or CodeMirror imports.  A
 * position is document identity first; presentation-specific mapping happens
 * in selection.ts and codeMirrorManager.ts at the interaction edge.
 */

export type DocumentSurface = "prose" | "task" | "code" | "special";
export type DocumentAffinity = "forward" | "backward" | "none";

export type DocumentPosition = {
    version: 1;
    mode: "wysiwyg" | "ir" | string;
    surface: DocumentSurface;
    /** Stable kind + ordinal, never a raw presentation-tree path. */
    blockKey: string;
    anchor: number;
    head: number;
    affinity: DocumentAffinity;
    presentation?: "preview" | "edit";
    /** Optional endpoint identities for a selection spanning two blocks. */
    anchorBlockKey?: string;
    headBlockKey?: string;
    anchorSurface?: DocumentSurface;
    headSurface?: DocumentSurface;
};

export type DocumentBoundaryKey =
    | "ArrowLeft"
    | "ArrowRight"
    | "ArrowUp"
    | "ArrowDown"
    | "Home"
    | "End";

export type DocumentBoundaryTarget = "previous" | "next" | null;

export const clampDocumentOffset = (offset: number, length = Number.POSITIVE_INFINITY) => {
    const safeOffset = Number.isFinite(offset) ? offset : 0;
    const safeLength = Number.isFinite(length) ? Math.max(0, length) : Number.POSITIVE_INFINITY;
    return Math.min(Math.max(0, safeOffset), safeLength);
};

export const documentAffinity = (anchor: number, head: number): DocumentAffinity => {
    if (anchor === head) {
        return "none";
    }
    return anchor < head ? "forward" : "backward";
};

export const normalizeDocumentPosition = (
    position: DocumentPosition,
    blockLength = Number.POSITIVE_INFINITY,
): DocumentPosition => {
    const anchor = clampDocumentOffset(position.anchor, blockLength);
    const head = clampDocumentOffset(position.head, blockLength);
    return {
        ...position,
        version: 1,
        anchor,
        head,
        affinity: documentAffinity(anchor, head),
    };
};

export const createDocumentBlockKey = (surface: DocumentSurface, ordinal: number) =>
    `${surface}:${Math.max(0, Math.floor(Number.isFinite(ordinal) ? ordinal : 0))}`;

export const createDocumentPosition = (position: Omit<DocumentPosition, "version" | "affinity">): DocumentPosition =>
    normalizeDocumentPosition({
        ...position,
        version: 1,
        affinity: "none",
    });

/** Preserve logical direction while a block is remounted with a new length. */
export const roundTripDocumentPosition = (
    position: DocumentPosition,
    nextBlockLength = Number.POSITIVE_INFINITY,
) => normalizeDocumentPosition(position, nextBlockLength);

/** Map an edge crossing without inventing a second selection direction. */
export const mapDocumentBoundary = (
    position: DocumentPosition,
    target: {
        surface: DocumentSurface;
        blockKey: string;
        offset: number;
        presentation?: "preview" | "edit";
    },
): DocumentPosition => {
    const offset = clampDocumentOffset(target.offset);
    return {
        ...position,
        version: 1,
        surface: target.surface,
        blockKey: target.blockKey,
        anchor: offset,
        head: offset,
        affinity: "none",
        presentation: target.presentation,
    };
};

/** Pure key policy shared by prose and CM boundary adapters. */
export const resolveDocumentBoundaryTarget = (
    key: DocumentBoundaryKey,
    atStart: boolean,
    atEnd: boolean,
    hasPrevious: boolean,
    hasNext: boolean,
): DocumentBoundaryTarget => {
    if ((key === "ArrowLeft" || key === "ArrowUp" || key === "Home") && atStart && hasPrevious) {
        return "previous";
    }
    if ((key === "ArrowRight" || key === "ArrowDown" || key === "End") && atEnd && hasNext) {
        return "next";
    }
    return null;
};

const sessionPositions = new WeakMap<object, DocumentPosition>();

/** In-memory only: intentionally distinct from ADR 0008 persisted open-doc focus. */
export const setSessionDocumentPosition = (owner: object, position: DocumentPosition) => {
    sessionPositions.set(owner, normalizeDocumentPosition(position));
};

export const getSessionDocumentPosition = (owner: object) => sessionPositions.get(owner);

export const clearSessionDocumentPosition = (owner: object) => {
    sessionPositions.delete(owner);
};
