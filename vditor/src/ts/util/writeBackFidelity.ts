/**
 * ADR 0015: keep the authored Markdown source as the fidelity baseline.
 *
 * Lute owns the editable DOM serialization, but its pretty-printing is not
 * user intent. This module is deliberately DOM-free so the same source
 * fingerprint policy can be used by the editor and the VS Code host.
 */

export type AuthoredSourceSpan = {
    start: number;
    end: number;
    kind: "table" | "block";
    key: string;
    text: string;
};

type WriteBackState = {
    source?: string;
    pendingIntent: boolean;
};

type VditorInstance = object;

const states = new WeakMap<VditorInstance, WriteBackState>();

const getState = (vditor: VditorInstance): WriteBackState => {
    let state = states.get(vditor);
    if (!state) {
        state = { pendingIntent: false };
        states.set(vditor, state);
    }
    return state;
};

/** The host's existing equality contract: line-ending conversion is harmless. */
export const sourceFingerprint = (source: string): string => source.replace(/\r/g, "");

export const noteAuthoredSource = (vditor: VditorInstance, source: string): void => {
    const state = getState(vditor);
    state.source = source;
    state.pendingIntent = false;
};

export const getAuthoredSource = (vditor: VditorInstance): string | undefined => getState(vditor).source;

export const noteAuthoredIntent = (vditor: VditorInstance): void => {
    getState(vditor).pendingIntent = true;
};

export const hasAuthoredIntent = (vditor: VditorInstance): boolean => getState(vditor).pendingIntent;

export const clearAuthoredIntent = (vditor: VditorInstance): void => {
    getState(vditor).pendingIntent = false;
};

/**
 * Return true when a candidate must not be written back.
 *
 * An authored intent may intentionally change whitespace/formatting, so only
 * exact source equality is skipped in that case. Without intent, all
 * candidates are rejected: a passive renderer has no authority to write.
 */
export const shouldSkipNoIntentWrite = (
    candidate: string,
    authoredSource: string | undefined,
    authoredIntent = false,
): boolean => {
    if (authoredSource === undefined) {
        return !authoredIntent;
    }
    if (sourceFingerprint(candidate) === sourceFingerprint(authoredSource)) {
        return true;
    }
    return !authoredIntent;
};

type SourceLine = {
    start: number;
    end: number;
    content: string;
};

const readLines = (source: string): SourceLine[] => {
    const lines: SourceLine[] = [];
    let start = 0;
    while (start < source.length) {
        let end = start;
        while (end < source.length && source[end] !== "\r" && source[end] !== "\n") {
            end++;
        }
        if (end < source.length) {
            if (source[end] === "\r" && source[end + 1] === "\n") {
                lines.push({ start, end: end + 2, content: source.slice(start, end) });
                start = end + 2;
            } else {
                lines.push({ start, end: end + 1, content: source.slice(start, end) });
                start = end + 1;
            }
        } else {
            lines.push({ start, end, content: source.slice(start, end) });
            start = end;
        }
    }
    return lines;
};

const splitTableRow = (line: string): string[] => {
    let value = line.trim();
    if (value.startsWith("|")) {
        value = value.slice(1);
    }
    if (value.endsWith("|") && !value.endsWith("\\|")) {
        value = value.slice(0, -1);
    }

    const cells: string[] = [];
    let cell = "";
    let escaped = false;
    for (const character of value) {
        if (escaped) {
            cell += character;
            escaped = false;
        } else if (character === "\\") {
            cell += character;
            escaped = true;
        } else if (character === "|") {
            cells.push(cell);
            cell = "";
        } else {
            cell += character;
        }
    }
    cells.push(cell);
    return cells;
};

const isTableDelimiter = (cells: string[]): boolean => cells.length >= 2
    && cells.every((cell) => /^:?-+:?$/.test(cell.trim()));

const isTableRow = (line: string): boolean => {
    const trimmed = line.trim();
    return trimmed.includes("|") && splitTableRow(trimmed).length >= 2;
};

const isTableStart = (header: string, delimiter: string): boolean => {
    const headerCells = splitTableRow(header);
    return headerCells.length >= 2 && isTableDelimiter(splitTableRow(delimiter));
};

const normalizeTableCell = (cell: string): string => cell.trim();

const tableSemanticKey = (text: string): string => {
    const rows = readLines(text)
        .map((line) => line.content)
        .filter((line) => line.trim() !== "")
        .map((line) => {
            const cells = splitTableRow(line);
            if (isTableDelimiter(cells)) {
                return `d:${cells.map((cell) => {
                    const value = cell.trim();
                    const left = value.startsWith(":");
                    const right = value.endsWith(":");
                    return left && right ? "center" : left ? "left" : right ? "right" : "none";
                }).join(",")}`;
            }
            return `r:${cells.map(normalizeTableCell).join("\u001f")}`;
        });
    return rows.join("\u001e");
};

const blockSemanticKey = (text: string): string => sourceFingerprint(text)
    .replace(/[ \t]+$/gm, "")
    .trim();

const spanKey = (kind: AuthoredSourceSpan["kind"], text: string): string =>
    `${kind}:${kind === "table" ? tableSemanticKey(text) : blockSemanticKey(text)}`;

/** Extract source spans without changing their byte offsets or line endings. */
export const extractAuthoredSourceSpans = (source: string): AuthoredSourceSpan[] => {
    const lines = readLines(source);
    const spans: AuthoredSourceSpan[] = [];
    let index = 0;
    while (index < lines.length) {
        if (lines[index].content.trim() === "") {
            index++;
            continue;
        }

        const start = lines[index].start;
        let endLine = index;
        let kind: AuthoredSourceSpan["kind"] = "block";
        if (index + 1 < lines.length && isTableStart(lines[index].content, lines[index + 1].content)) {
            kind = "table";
            endLine = index + 1;
            while (endLine + 1 < lines.length
                && lines[endLine + 1].content.trim() !== ""
                && isTableRow(lines[endLine + 1].content)) {
                endLine++;
            }
        } else {
            while (endLine + 1 < lines.length && lines[endLine + 1].content.trim() !== "") {
                endLine++;
            }
        }

        const end = lines[endLine].end;
        const text = source.slice(start, end);
        spans.push({ start, end, kind, key: spanKey(kind, text), text });
        index = endLine + 1;
    }
    return spans;
};

export const authoredDocumentSemanticKey = (source: string): string => extractAuthoredSourceSpans(source)
    .map((span) => span.key)
    .join("\u001d");

const sameSpanSequence = (left: AuthoredSourceSpan[], right: AuthoredSourceSpan[]): boolean =>
    left.length === right.length && left.every((span, index) => span.key === right[index].key);

const findPreservingPairs = (
    authored: AuthoredSourceSpan[],
    candidate: AuthoredSourceSpan[],
): Array<[number, number]> => {
    const lengths: number[][] = Array.from({ length: authored.length + 1 }, () =>
        Array.from({ length: candidate.length + 1 }, () => 0));
    for (let authoredIndex = authored.length - 1; authoredIndex >= 0; authoredIndex--) {
        for (let candidateIndex = candidate.length - 1; candidateIndex >= 0; candidateIndex--) {
            lengths[authoredIndex][candidateIndex] = authored[authoredIndex].key === candidate[candidateIndex].key
                ? lengths[authoredIndex + 1][candidateIndex + 1] + 1
                : Math.max(lengths[authoredIndex + 1][candidateIndex], lengths[authoredIndex][candidateIndex + 1]);
        }
    }

    const pairs: Array<[number, number]> = [];
    let authoredIndex = 0;
    let candidateIndex = 0;
    while (authoredIndex < authored.length && candidateIndex < candidate.length) {
        if (authored[authoredIndex].key === candidate[candidateIndex].key) {
            pairs.push([authoredIndex, candidateIndex]);
            authoredIndex++;
            candidateIndex++;
        } else if (lengths[authoredIndex + 1][candidateIndex] >= lengths[authoredIndex][candidateIndex + 1]) {
            authoredIndex++;
        } else {
            candidateIndex++;
        }
    }
    return pairs;
};

/**
 * Restore authored bytes for spans whose semantic content did not change.
 * This keeps unrelated tables and blocks stable after a local edit.
 */
export const preserveAuthoredSpans = (
    authoredSource: string,
    candidate: string,
    preserveWholeDocument = true,
): string => {
    if (sourceFingerprint(authoredSource) === sourceFingerprint(candidate)) {
        return authoredSource;
    }

    const authoredSpans = extractAuthoredSourceSpans(authoredSource);
    const candidateSpans = extractAuthoredSourceSpans(candidate);
    if (sameSpanSequence(authoredSpans, candidateSpans)) {
        return preserveWholeDocument ? authoredSource : candidate;
    }

    const pairs = findPreservingPairs(authoredSpans, candidateSpans);
    if (pairs.length === 0) {
        return candidate;
    }

    let result = "";
    let cursor = 0;
    for (const [authoredIndex, candidateIndex] of pairs) {
        const candidateSpan = candidateSpans[candidateIndex];
        result += candidate.slice(cursor, candidateSpan.start);
        result += authoredSpans[authoredIndex].text;
        cursor = candidateSpan.end;
    }
    return result + candidate.slice(cursor);
};

/** Apply the fidelity baseline to a Vditor serialization. */
export const preserveAuthoredSource = (vditor: VditorInstance, candidate: string): string => {
    const authoredSource = getAuthoredSource(vditor);
    if (authoredSource === undefined) {
        return candidate;
    }
    // A semantically unchanged document is a presentation round-trip, even if
    // an afterRender callback was scheduled with its historical input default.
    // This is what prevents compact tables from becoming a dirty save.
    return preserveAuthoredSpans(authoredSource, candidate, true);
};
