/**
 * ADR 0011 document-semantic search.
 *
 * This module has no DOM or editor dependencies. Callers provide the
 * canonical authored segments in document order; matches then carry the
 * same source-range identity regardless of whether a block is mounted in
 * CodeMirror or is still represented by its source node.
 */

export type DocumentSearchSurface = "prose" | "task" | "code" | "special";

export type DocumentSearchSourceRange = {
    /** Stable source identity. For editor blocks this is the ADR 0010 blockKey. */
    sourceId: string;
    blockKey: string;
    surface: DocumentSearchSurface;
    start: number;
    end: number;
};

export type DocumentSearchSegment = {
    /** Stable identity for the authored source, not a DOM path or CM view. */
    sourceId: string;
    blockKey: string;
    surface: DocumentSearchSurface;
    text: string;
    /** Canonical document order. Array order remains the fallback. */
    order?: number;
    /** Presentation adapters can mark a segment out of scope before indexing. */
    searchable?: boolean;
};

export type DocumentSearchMatch = {
    id: string;
    text: string;
    segment: DocumentSearchSegment;
    sourceRange: DocumentSearchSourceRange;
};

export type DocumentSearchOptions = {
    matchCase?: boolean;
    wholeWord?: boolean;
    regex?: boolean;
};

export type DocumentSearchSegmentInput = Omit<DocumentSearchSegment, "sourceId"> & {
    sourceId?: string;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSearchSource = (query: string, options: DocumentSearchOptions) => {
    const base = options.regex ? query : escapeRegExp(query);
    return options.wholeWord ? `\\b(?:${base})\\b` : base;
};

const buildRegexFlags = (matchCase: boolean) => matchCase ? "g" : "gi";

/**
 * Normalize one authored segment at the module seam.
 *
 * `sourceId` defaults to `blockKey`, so a prose segment and a mounted code
 * representation can share identity when the adapter gives them the same
 * document key. `searchable: false` is retained for adapters but filtered by
 * `buildDocumentSearchSegments` before a query runs.
 */
export const createDocumentSearchSegment = (input: DocumentSearchSegmentInput): DocumentSearchSegment => ({
    sourceId: input.sourceId || input.blockKey,
    blockKey: input.blockKey,
    surface: input.surface,
    text: input.text,
    ...(input.order === undefined ? {} : { order: input.order }),
    ...(input.searchable === undefined ? {} : { searchable: input.searchable }),
});

export const buildProseSearchSegment = (input: Omit<DocumentSearchSegmentInput, "surface">) =>
    createDocumentSearchSegment({ ...input, surface: "prose" });

export const buildTaskSearchSegment = (input: Omit<DocumentSearchSegmentInput, "surface">) =>
    createDocumentSearchSegment({ ...input, surface: "task" });

export const buildCodeSearchSegment = (
    input: Omit<DocumentSearchSegmentInput, "surface"> & { surface?: "code" | "special" },
) => createDocumentSearchSegment({ ...input, surface: input.surface || "code" });

/** Return normalized authored segments in stable document order. */
export const buildDocumentSearchSegments = (segments: DocumentSearchSegmentInput[]): DocumentSearchSegment[] =>
    segments
        .map(createDocumentSearchSegment)
        .filter((segment) => segment.searchable !== false && segment.text.length > 0)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

/**
 * Find every non-empty match in the supplied authored stream.
 *
 * The function intentionally throws for an invalid regular expression so a
 * presentation adapter can show its existing inline query error without
 * inventing a partial result set.
 */
export const findInDocumentSearchIndex = (
    segments: DocumentSearchSegmentInput[] | DocumentSearchSegment[],
    query: string,
    options: DocumentSearchOptions = {},
): DocumentSearchMatch[] => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
        return [];
    }

    const indexedSegments = buildDocumentSearchSegments(segments);
    const regex = new RegExp(
        buildSearchSource(normalizedQuery, options),
        buildRegexFlags(options.matchCase === true),
    );
    const matches: DocumentSearchMatch[] = [];

    for (const segment of indexedSegments) {
        regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(segment.text)) !== null) {
            const matchedText = match[0];
            if (!matchedText) {
                regex.lastIndex += 1;
                continue;
            }
            const start = match.index;
            const end = start + matchedText.length;
            const sourceRange: DocumentSearchSourceRange = {
                sourceId: segment.sourceId,
                blockKey: segment.blockKey,
                surface: segment.surface,
                start,
                end,
            };
            matches.push({
                id: `${sourceRange.sourceId}:${start}-${end}`,
                text: matchedText,
                segment,
                sourceRange,
            });
        }
    }

    return matches;
};


/**
 * Presentation exclusion policy for the searchable stream (ADR 0011).
 * Adapters should keep chrome / hidden / aria-hidden out by policy—not only
 * by incidental DOM skip lists. Class/selector tokens live here so FindBar
 * and unit tests share one gate.
 */
export const DOCUMENT_SEARCH_EXCLUDED_SELECTORS = [
    ".cm-editor",
    ".vditor-cm-chrome",
    ".vditor-find-bar",
    ".vditor-toolbar",
    "[hidden]",
    "[aria-hidden=\"true\"]",
] as const;

export const DOCUMENT_SEARCH_EXCLUSION_SELECTOR = DOCUMENT_SEARCH_EXCLUDED_SELECTORS.join(", ");

export type DocumentSearchPresentationFlags = {
    hidden?: boolean;
    ariaHidden?: boolean;
    className?: string;
    tagName?: string;
};

/** Pure policy gate used by adapters and unit tests. */
export const isExcludedFromDocumentSearch = (flags: DocumentSearchPresentationFlags): boolean => {
    if (flags.hidden || flags.ariaHidden) {
        return true;
    }
    const className = ` ${flags.className || ""} `;
    if (
        className.includes(" vditor-find-bar ")
        || className.includes(" vditor-cm-chrome ")
        || className.includes(" vditor-toolbar ")
        || className.includes(" cm-editor ")
    ) {
        return true;
    }
    const tag = (flags.tagName || "").toLowerCase();
    return tag === "button" && className.includes(" vditor-");
};

export type DocumentSearchReplacement = {
    sourceId: string;
    start: number;
    end: number;
    insert: string;
};

/**
 * Apply replacements to authored segment text by shared source-range identity.
 * Later ranges in the same source are applied right-to-left so offsets stay valid.
 * Returns new segment texts and the number of applied edits (for count coherence).
 */
export const applyDocumentSearchReplacements = (
    segments: DocumentSearchSegmentInput[] | DocumentSearchSegment[],
    replacements: DocumentSearchReplacement[],
): { segments: DocumentSearchSegment[]; applied: number } => {
    const indexed = buildDocumentSearchSegments(segments).map((segment) => ({ ...segment }));
    const byId = new Map(indexed.map((segment) => [segment.sourceId, segment]));
    const grouped = new Map<string, DocumentSearchReplacement[]>();
    for (const replacement of replacements) {
        const list = grouped.get(replacement.sourceId) || [];
        list.push(replacement);
        grouped.set(replacement.sourceId, list);
    }

    let applied = 0;
    grouped.forEach((list, sourceId) => {
        const segment = byId.get(sourceId);
        if (!segment) {
            return;
        }
        list.sort((a, b) => b.start - a.start || b.end - a.end);
        let text = segment.text;
        for (const replacement of list) {
            const start = Math.max(0, Math.min(replacement.start, text.length));
            const end = Math.max(start, Math.min(replacement.end, text.length));
            text = `${text.slice(0, start)}${replacement.insert}${text.slice(end)}`;
            applied += 1;
        }
        segment.text = text;
    });

    return { segments: indexed, applied };
};
