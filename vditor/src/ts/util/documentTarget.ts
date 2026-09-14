/**
 * ADR 0012: the shared inline-object target contract.
 *
 * This module is intentionally presentation agnostic. DOM adapters are
 * responsible for discovering a target and executing an action; this module
 * owns the vocabulary, source/display distinction, identity, and gesture
 * policy they all consume.
 */
import type { DocumentPosition } from "./documentPosition";

export type DocumentTargetKind =
    | "link"
    | "link-ref"
    | "wikilink"
    | "wikilink-embed"
    | "image"
    | "html-inline"
    | "html-block";

export type DocumentTargetGesture =
    | "click"
    | "modified-click"
    | "dblclick"
    | "auxclick"
    | "alt-enter";

export type DocumentTargetActivation = "edit" | "host-open" | "none";

export type DocumentSourceRange = {
    start: number;
    end: number;
};

export type DocumentTargetSource = {
    /** Visible label, when the object has one. */
    display: string;
    /** Link/image/wiki destination, when the object has one. */
    destination: string;
    /** Authored source for source-popover targets such as raw HTML. */
    source: string;
    displayRange?: DocumentSourceRange;
    destinationRange?: DocumentSourceRange;
    sourceRange?: DocumentSourceRange;
};

export type DocumentTargetField = {
    name: "display" | "destination" | "path" | "fragment" | "alt" | "source" | "reference";
    value: string;
    sourceRange?: DocumentSourceRange;
};

export type DocumentTargetHostOpenAction = {
    kind: "external" | "fragment" | "wiki";
    uri: string;
};

export type DocumentTargetFocusAnchor = {
    /** Stable semantic identity, not a DOM node/path. */
    identity: string;
    position: DocumentPosition;
    edge: "before" | "after" | "content";
};

export type DocumentTarget = {
    version: 1;
    kind: DocumentTargetKind;
    identity: string;
    source: DocumentTargetSource;
    activation: Readonly<Record<DocumentTargetGesture, DocumentTargetActivation>>;
    editableFields: readonly DocumentTargetField[];
    hostOpen: DocumentTargetHostOpenAction | null;
    focusAnchor: DocumentTargetFocusAnchor | null;
};

type DocumentTargetInput = {
    kind: DocumentTargetKind;
    source?: Partial<DocumentTargetSource>;
    editableFields?: readonly DocumentTargetField[];
    hostOpen?: DocumentTargetHostOpenAction | null;
    focusAnchor?: DocumentTargetFocusAnchor | null;
    identity?: string;
};

const emptySource = (): DocumentTargetSource => ({
    display: "",
    destination: "",
    source: "",
});

const normalizeRange = (range?: DocumentSourceRange): DocumentSourceRange | undefined => {
    if (!range) {
        return undefined;
    }
    const start = Number.isFinite(range.start) ? Math.max(0, Math.floor(range.start)) : 0;
    const end = Number.isFinite(range.end) ? Math.max(start, Math.floor(range.end)) : start;
    return { start, end };
};

const normalizeSource = (source: Partial<DocumentTargetSource> = {}): DocumentTargetSource => ({
    ...emptySource(),
    ...source,
    displayRange: normalizeRange(source.displayRange),
    destinationRange: normalizeRange(source.destinationRange),
    sourceRange: normalizeRange(source.sourceRange),
});

const focusAnchorIdentity = (anchor: DocumentTargetFocusAnchor) => {
    const position = anchor.position;
    return [
        "document-target",
        position.mode,
        position.anchorBlockKey || position.blockKey,
        position.anchor,
        position.headBlockKey || position.blockKey,
        position.head,
        anchor.edge,
    ].join(":");
};

export const createDocumentTargetFocusAnchor = (
    position: DocumentPosition,
    edge: DocumentTargetFocusAnchor["edge"] = "after",
    identity?: string,
): DocumentTargetFocusAnchor => ({
    identity: identity || focusAnchorIdentity({ identity: "", position, edge }),
    position,
    edge,
});

export const createDocumentTargetIdentity = (input: {
    kind: DocumentTargetKind;
    sourceRange?: DocumentSourceRange;
    focusAnchor?: DocumentTargetFocusAnchor | null;
    identity?: string;
}) => {
    if (input.identity) {
        return input.identity;
    }
    if (input.focusAnchor) {
        return `${input.kind}:${input.focusAnchor.identity}`;
    }
    const range = normalizeRange(input.sourceRange);
    return ["document-target", input.kind, range?.start ?? 0, range?.end ?? 0].join(":");
};

const hostOpenActivation = (hostOpen: DocumentTargetHostOpenAction | null): DocumentTargetActivation =>
    hostOpen ? "host-open" : "edit";

/** One gesture table for every inline object. Plain click is always edit. */
export const createDocumentTargetActivation = (
    hostOpen: DocumentTargetHostOpenAction | null,
): Readonly<Record<DocumentTargetGesture, DocumentTargetActivation>> => {
    const open = hostOpenActivation(hostOpen);
    return {
        click: "edit",
        "modified-click": open,
        dblclick: open,
        auxclick: open,
        "alt-enter": "edit",
    };
};

export const createDocumentTarget = (input: DocumentTargetInput): DocumentTarget => {
    const source = normalizeSource(input.source);
    const focusAnchor = input.focusAnchor ?? null;
    const sourceRange = source.sourceRange || source.destinationRange || source.displayRange;
    const hostOpen = input.hostOpen ?? null;
    return {
        version: 1,
        kind: input.kind,
        identity: createDocumentTargetIdentity({
            kind: input.kind,
            sourceRange,
            focusAnchor,
            identity: input.identity,
        }),
        source,
        activation: createDocumentTargetActivation(hostOpen),
        editableFields: input.editableFields || [],
        hostOpen,
        focusAnchor,
    };
};

export const getDocumentTargetActivation = (
    target: DocumentTarget,
    gesture: DocumentTargetGesture,
): DocumentTargetActivation => target.activation[gesture];

