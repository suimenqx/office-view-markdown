import { EditorSelection, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";

import {
    focusCodeMirrorAtDocumentPosition,
    getCodeMirrorView,
} from "../codeBlock/codeMirrorManager";
import {
    buildCodeSearchSegment,
    buildDocumentSearchSegments,
    buildProseSearchSegment,
    buildTaskSearchSegment,
    DOCUMENT_SEARCH_EXCLUSION_SELECTOR,
    findInDocumentSearchIndex,
    type DocumentSearchMatch,
    type DocumentSearchOptions,
    type DocumentSearchSegment,
} from "../util/documentSearchIndex";
import { createDocumentPosition, setSessionDocumentPosition } from "../util/documentPosition";
import { commitAuthoredEdit, runPresentationOnly } from "../util/editTransaction";
import {
    getDocumentPositionBlockKey,
    restoreDocumentPositionInEditor,
    scrollCaretIntoEditorView,
    setSelectionFocusWithAffinity,
} from "../util/selection";

const HIGHLIGHT_CLASS = "vditor-find-highlight";
const CURRENT_CLASS = "vditor-find-highlight--current";
const CSS_FIND_MATCH = "vditor-find-match";
const CSS_FIND_CURRENT = "vditor-find-current";
const FIND_SKIP_SELECTOR = DOCUMENT_SEARCH_EXCLUSION_SELECTOR;

const c = (name: string) => `<span class="codicon codicon-${name}" aria-hidden="true"></span>`;

type FindOptionsState = Required<DocumentSearchOptions>;

type SearchTextNode = {
    node: Text;
    start: number;
    end: number;
};

type RenderedSearchSegment = {
    segment: DocumentSearchSegment;
    block: HTMLElement;
    kind: "prose" | "code";
    nodes: SearchTextNode[];
    sourceElement?: HTMLElement;
};

type FindMatch = DocumentSearchMatch;

interface CompiledPattern {
    global: RegExp;
    single: RegExp;
}

const cmDecorationsEffect = StateEffect.define<DecorationSet>();

const cmDecorationsField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },
    update(decorations, tr) {
        decorations = decorations.map(tr.changes);
        for (const effect of tr.effects) {
            if (effect.is(cmDecorationsEffect)) {
                decorations = effect.value;
            }
        }
        return decorations;
    },
    provide: (field) => EditorView.decorations.from(field),
});

const supportsCssCustomHighlight = () => typeof CSS !== "undefined" && "highlights" in CSS;

const ensureFindDecorationsField = (view: EditorView) => {
    if (view.state.field(cmDecorationsField, false)) {
        return;
    }
    view.dispatch({
        effects: StateEffect.appendConfig.of([cmDecorationsField]),
    });
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSearchSource = (query: string, options: FindOptionsState) => {
    const base = options.regex ? query : escapeRegExp(query);
    return options.wholeWord ? `\\b(?:${base})\\b` : base;
};

const buildRegexFlags = (matchCase: boolean, global: boolean) => {
    return `${global ? "g" : ""}${matchCase ? "" : "i"}`;
};

const compilePattern = (query: string, options: FindOptionsState): CompiledPattern => {
    const source = buildSearchSource(query, options);
    return {
        global: new RegExp(source, buildRegexFlags(options.matchCase, true)),
        single: new RegExp(source, buildRegexFlags(options.matchCase, false)),
    };
};

export class FindBar {
    public element: HTMLElement;
    private input: HTMLInputElement;
    private replaceInput: HTMLInputElement;
    private replaceRow: HTMLElement;
    private replaceToggleBtn: HTMLButtonElement;
    private countEl: HTMLElement;
    private matches: FindMatch[] = [];
    private renderedSegments = new Map<string, RenderedSearchSegment>();
    private currentIndex = -1;
    private vditor: IVditor;
    private options: FindOptionsState = {
        matchCase: false,
        wholeWord: false,
        regex: false,
    };
    private compiledPattern: CompiledPattern | null = null;
    private queryError: string | null = null;
    private replaceExpanded = false;
    private editorObserver: MutationObserver | null = null;
    private refreshScheduled = false;
    private focusRestoreTimer = 0;
    private activeFindField: HTMLInputElement | null = null;
    private findComposing = false;
    private suppressRefresh = false;

    constructor(vditor: IVditor) {
        this.vditor = vditor;

        const i18n = window.VditorI18n;
        this.element = document.createElement("div");
        this.element.className = "vditor-find-bar";
        this.element.style.display = "none";
        this.element.innerHTML = `
            <div class="vditor-find-bar__row">
                <input
                    type="text"
                    class="vditor-find-bar__input"
                    placeholder="${i18n?.["find-placeholder"] || "Find…"}"
                />
                <span class="vditor-find-bar__count"></span>
                <button type="button" class="vditor-find-bar__option" data-option="matchCase" title="${i18n?.["find-match-case"] || "Match Case"}">Aa</button>
                <button type="button" class="vditor-find-bar__option" data-option="wholeWord" title="${i18n?.["find-whole-word"] || "Whole Word"}">W</button>
                <button type="button" class="vditor-find-bar__option" data-option="regex" title="${i18n?.["find-regex"] || "Use Regular Expression"}">.*</button>
                <button type="button" class="vditor-find-bar__option" data-action="toggle-replace" title="${i18n?.["find-toggle-replace"] || "Toggle Replace"}">R</button>
                <button type="button" class="vditor-find-bar__nav" data-dir="-1" title="${i18n?.["find-previous"] || "Previous (Shift+Enter)"}">${c("arrow-up")}</button>
                <button type="button" class="vditor-find-bar__nav" data-dir="1" title="${i18n?.["find-next"] || "Next (Enter)"}">${c("arrow-down")}</button>
                <button type="button" class="vditor-find-bar__close" title="${i18n?.close || "Close"}">${c("close")}</button>
            </div>
            <div class="vditor-find-bar__row vditor-find-bar__row--replace" style="display: none;">
                <input
                    type="text"
                    class="vditor-find-bar__input vditor-find-bar__input--replace"
                    placeholder="${i18n?.["replace-placeholder"] || "Replace…"}"
                />
                <button type="button" class="vditor-find-bar__action" data-action="replace">${i18n?.["find-replace"] || "Replace"}</button>
                <button type="button" class="vditor-find-bar__action" data-action="replace-all">${i18n?.["find-replace-all"] || "Replace All"}</button>
            </div>
        `;

        this.input = this.element.querySelector(".vditor-find-bar__input") as HTMLInputElement;
        this.replaceInput = this.element.querySelector(".vditor-find-bar__input--replace") as HTMLInputElement;
        this.replaceRow = this.element.querySelector(".vditor-find-bar__row--replace") as HTMLElement;
        this.replaceToggleBtn = this.element.querySelector("[data-action='toggle-replace']") as HTMLButtonElement;
        this.countEl = this.element.querySelector(".vditor-find-bar__count") as HTMLElement;

        this.input.addEventListener("focus", () => {
            this.activeFindField = this.input;
        });
        this.replaceInput.addEventListener("focus", () => {
            this.activeFindField = this.replaceInput;
        });

        this.input.addEventListener("compositionstart", () => {
            this.findComposing = true;
        });
        this.input.addEventListener("compositionend", () => {
            this.findComposing = false;
            this.search();
        });
        this.input.addEventListener("input", (event: Event) => {
            const inputEvent = event as InputEvent;
            if (this.findComposing || inputEvent.isComposing) {
                return;
            }
            this.search();
        });

        this.input.addEventListener("keydown", (e) => {
            if (e.isComposing) {
                return;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                this.navigate(e.shiftKey ? -1 : 1);
            } else if (e.key === "Escape") {
                this.hide();
            }
        });

        this.replaceInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (e.shiftKey) {
                    this.replaceAll();
                } else {
                    this.replaceCurrent();
                }
            } else if (e.key === "Escape") {
                this.hide();
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key !== "Escape" || !this.isVisible()) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        }, true);

        (this.element.querySelector("[data-dir='-1']") as HTMLElement).addEventListener("click", () => this.navigate(-1));
        (this.element.querySelector("[data-dir='1']") as HTMLElement).addEventListener("click", () => this.navigate(1));
        (this.element.querySelector(".vditor-find-bar__close") as HTMLElement).addEventListener("click", () => this.hide());
        this.replaceToggleBtn.addEventListener("click", () => this.toggleReplace());
        (this.element.querySelector("[data-action='replace']") as HTMLElement).addEventListener("click", () => this.replaceCurrent());
        (this.element.querySelector("[data-action='replace-all']") as HTMLElement).addEventListener("click", () => this.replaceAll());
        this.element.querySelectorAll<HTMLElement>("[data-option]").forEach((button) => {
            button.addEventListener("click", () => {
                const key = button.dataset.option as keyof FindOptionsState;
                this.options[key] = !this.options[key];
                button.classList.toggle("vditor-find-bar__option--active", this.options[key]);
                button.setAttribute("aria-pressed", String(this.options[key]));
                this.search();
            });
        });
    }

    private getContentEl(): HTMLElement | null {
        const mode = this.vditor.currentMode;
        if (mode === "ir") return this.vditor.element.querySelector(".vditor-ir");
        if (mode === "wysiwyg") return this.vditor.element.querySelector(".vditor-wysiwyg");
        return null;
    }

    private getScrollElement(): HTMLElement | null {
        const contentEl = this.getContentEl();
        if (!contentEl) return null;
        if (contentEl.classList.contains("vditor-reset")) {
            return contentEl;
        }
        return contentEl.querySelector(".vditor-reset") as HTMLElement | null;
    }

    private getEditorRoot(): HTMLElement | null {
        return this.getScrollElement() || this.getContentEl();
    }

    private getSearchBlock(node: Node, editor: HTMLElement): HTMLElement {
        const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement;
        const block = element?.closest<HTMLElement>(
            "[data-type='code-block'], [data-type='math-block'], li.vditor-task, [data-block='0'], p, h1, h2, h3, h4, h5, h6, blockquote, ul, ol",
        );
        return block && editor.contains(block) ? block : editor;
    }

    private isExcludedSearchNode(node: Node): boolean {
        const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement;
        return !!element?.closest(FIND_SKIP_SELECTOR);
    }

    private getBlockKey(editor: HTMLElement, block: HTMLElement, fallback: "prose" | "code" | "special" = "prose") {
        if (block === editor) {
            return `${fallback}:0`;
        }
        try {
            return getDocumentPositionBlockKey(editor, block);
        } catch {
            return `${fallback}:0`;
        }
    }

    private getCodeSource(block: HTMLElement) {
        const sourceElement = block.querySelector("pre code, code") as HTMLElement | null;
        const text = (sourceElement?.textContent || "").replaceAll("\u200B", "");
        return { sourceElement, text };
    }

    private buildRenderedSearchSegments(): RenderedSearchSegment[] {
        const editor = this.getEditorRoot();
        if (!editor) {
            return [];
        }

        const proseGroups = new Map<HTMLElement, { block: HTMLElement; nodes: SearchTextNode[]; firstNode: Node }>();
        const specialBlocks = new Set<HTMLElement>();
        const walker = editor.ownerDocument.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
            const textNode = node as Text;
            if (!textNode.textContent || this.isExcludedSearchNode(textNode)) {
                continue;
            }
            const parent = textNode.parentElement;
            const codeBlock = parent?.closest<HTMLElement>("[data-type='code-block'], [data-type='math-block']");
            if (codeBlock && editor.contains(codeBlock)) {
                specialBlocks.add(codeBlock);
                continue;
            }
            const inlineMath = parent?.closest<HTMLElement>("[data-type='math-inline']");
            if (inlineMath && editor.contains(inlineMath)) {
                specialBlocks.add(inlineMath);
                continue;
            }
            const block = this.getSearchBlock(textNode, editor);
            const group = proseGroups.get(block) || { block, nodes: [], firstNode: textNode };
            const start = group.nodes.length === 0 ? 0 : group.nodes[group.nodes.length - 1].end;
            group.nodes.push({ node: textNode, start, end: start + textNode.textContent.length });
            proseGroups.set(block, group);
        }

        editor.querySelectorAll<HTMLElement>("[data-type='code-block'], [data-type='math-block'], [data-type='math-inline']")
            .forEach((block) => specialBlocks.add(block));

        const entries: Array<RenderedSearchSegment & { firstNode: Node }> = [];
        proseGroups.forEach((group) => {
            const surface = group.block.classList.contains("vditor-task") ? "task" : "prose";
            const blockKey = this.getBlockKey(editor, group.block, surface === "task" ? "prose" : "prose");
            const text = group.nodes.map((item) => item.node.textContent || "").join("");
            const segment = surface === "task"
                ? buildTaskSearchSegment({ blockKey, text, order: 0 })
                : buildProseSearchSegment({ blockKey, text, order: 0 });
            entries.push({ segment, block: group.block, kind: "prose", nodes: group.nodes, firstNode: group.firstNode });
        });

        let inlineMathOrdinal = 0;
        specialBlocks.forEach((block) => {
            const isInlineMath = block.getAttribute("data-type") === "math-inline";
            const isCodeBlock = block.getAttribute("data-type") === "code-block";
            if (!isInlineMath && !isCodeBlock && block.getAttribute("data-type") !== "math-block") {
                return;
            }
            const source = this.getCodeSource(block);
            if (isInlineMath) {
                const parentBlock = this.getSearchBlock(block, editor);
                const parentKey = this.getBlockKey(editor, parentBlock);
                const blockKey = `${parentKey}:inline-math:${inlineMathOrdinal++}`;
                const segment = buildCodeSearchSegment({
                    blockKey,
                    sourceId: blockKey,
                    text: source.text,
                    order: 0,
                    surface: "special",
                });
                entries.push({ segment, block, kind: "code", nodes: [], sourceElement: source.sourceElement || undefined, firstNode: block });
                return;
            }
            const fallback = block.getAttribute("data-type") === "math-block" ? "special" : "code";
            const blockKey = this.getBlockKey(editor, block, fallback);
            const segment = buildCodeSearchSegment({
                blockKey,
                text: source.text,
                order: 0,
                surface: fallback,
            });
            entries.push({ segment, block, kind: "code", nodes: [], sourceElement: source.sourceElement || undefined, firstNode: block });
        });

        entries.sort((a, b) => {
            if (a.firstNode === b.firstNode) {
                return 0;
            }
            const position = a.firstNode.compareDocumentPosition(b.firstNode);
            if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
                return -1;
            }
            if (position & Node.DOCUMENT_POSITION_PRECEDING) {
                return 1;
            }
            return 0;
        });

        const indexedSegments = buildDocumentSearchSegments(entries.map((entry, order) => ({
            ...entry.segment,
            order,
        })));
        const bySourceId = new Map(indexedSegments.map((segment) => [segment.sourceId, segment]));
        return entries
            .map((entry) => {
                const segment = bySourceId.get(entry.segment.sourceId);
                return segment ? { ...entry, segment } : null;
            })
            .filter((entry): entry is RenderedSearchSegment & { firstNode: Node } => !!entry);
    }

    private getRenderedSegment(match: FindMatch) {
        return this.renderedSegments.get(match.segment.sourceId);
    }

    private setRangeEndpoint(range: Range, nodes: SearchTextNode[], offset: number, start: boolean) {
        const safeOffset = Math.max(0, offset);
        for (const item of nodes) {
            if (safeOffset <= item.end) {
                const nodeOffset = Math.max(0, Math.min(item.node.textContent?.length || 0, safeOffset - item.start));
                if (start) {
                    range.setStart(item.node, nodeOffset);
                } else {
                    range.setEnd(item.node, nodeOffset);
                }
                return;
            }
        }
        const last = nodes[nodes.length - 1];
        if (last) {
            const nodeOffset = last.node.textContent?.length || 0;
            if (start) {
                range.setStart(last.node, nodeOffset);
            } else {
                range.setEnd(last.node, nodeOffset);
            }
        }
    }

    private getProseMatchRange(match: FindMatch): Range | null {
        const rendered = this.getRenderedSegment(match);
        if (!rendered || rendered.kind !== "prose" || rendered.nodes.length === 0) {
            return null;
        }
        try {
            const range = rendered.block.ownerDocument.createRange();
            this.setRangeEndpoint(range, rendered.nodes, match.sourceRange.start, true);
            this.setRangeEndpoint(range, rendered.nodes, match.sourceRange.end, false);
            return range;
        } catch {
            return null;
        }
    }

    private bindEditorRefresh() {
        this.unbindEditorRefresh();
        const editor = this.getEditorRoot();
        if (!editor) {
            return;
        }
        this.editorObserver = new MutationObserver(() => {
            if (this.suppressRefresh) {
                return;
            }
            this.scheduleRefresh();
        });
        this.editorObserver.observe(editor, {
            subtree: true,
            childList: true,
            characterData: true,
        });
    }

    private unbindEditorRefresh() {
        this.editorObserver?.disconnect();
        this.editorObserver = null;
        this.refreshScheduled = false;
    }

    private cancelRestoreFindFocus() {
        if (this.focusRestoreTimer) {
            window.clearTimeout(this.focusRestoreTimer);
            this.focusRestoreTimer = 0;
        }
    }

    /** CM 懒加载/滚动会抢焦点，延迟把焦点还给查找框 */
    private scheduleRestoreFindFocus() {
        if (!this.isVisible()) {
            return;
        }
        this.cancelRestoreFindFocus();
        const target = this.activeFindField ?? this.input;
        const selectionStart = target.selectionStart ?? target.value.length;
        const selectionEnd = target.selectionEnd ?? selectionStart;
        this.focusRestoreTimer = window.setTimeout(() => {
            this.focusRestoreTimer = 0;
            if (!this.isVisible() || document.activeElement === target) {
                return;
            }
            target.focus({ preventScroll: true });
            target.setSelectionRange(selectionStart, selectionEnd);
        }, 0);
    }

    private scheduleRefresh() {
        if (this.refreshScheduled || this.suppressRefresh || !this.isVisible()) {
            return;
        }
        this.refreshScheduled = true;
        window.requestAnimationFrame(() => {
            this.refreshScheduled = false;
            if (this.suppressRefresh || !this.isVisible() || !this.input.value.trim()) {
                return;
            }
            const preferredIndex = this.currentIndex >= 0 ? this.currentIndex : 0;
            this.search(preferredIndex);
        });
    }

    private getReplacementText(matchedText: string) {
        if (!this.compiledPattern) {
            return this.replaceInput.value;
        }
        return matchedText.replace(this.compiledPattern.single, this.replaceInput.value);
    }

    private buildPattern() {
        const query = this.input.value.trim();
        if (!query) {
            this.compiledPattern = null;
            this.queryError = null;
            return null;
        }

        try {
            this.compiledPattern = compilePattern(query, this.options);
            this.queryError = null;
            return this.compiledPattern;
        } catch {
            this.compiledPattern = null;
            this.queryError = window.VditorI18n?.["find-invalid-regex"] || "Invalid regular expression";
            return null;
        }
    }

    private ensureCodeMirrorMatchView(match: FindMatch) {
        const rendered = this.getRenderedSegment(match);
        if (!rendered || rendered.kind !== "code") {
            return undefined;
        }
        const isEmbeddedBlock = rendered.block.matches("[data-type='code-block'], [data-type='math-block']");
        if (!isEmbeddedBlock) {
            rendered.block.scrollIntoView({ block: "nearest", inline: "nearest" });
            rendered.sourceElement?.scrollIntoView({ block: "nearest", inline: "nearest" });
            return undefined;
        }

        this.suppressRefresh = true;
        runPresentationOnly(this.vditor, () => {
            focusCodeMirrorAtDocumentPosition(
                rendered.block,
                match.sourceRange.start,
                match.sourceRange.end,
                this.vditor,
                true,
            );
        });
        window.setTimeout(() => {
            this.suppressRefresh = false;
        }, 0);
        return getCodeMirrorView(rendered.block);
    }

    private setReplaceExpanded(expanded: boolean) {
        this.replaceExpanded = expanded;
        this.replaceRow.style.display = expanded ? "flex" : "none";
        this.replaceToggleBtn.classList.toggle("vditor-find-bar__option--active", expanded);
        this.replaceToggleBtn.setAttribute("aria-pressed", String(expanded));
    }

    private toggleReplace() {
        this.setReplaceExpanded(!this.replaceExpanded);
        if (this.replaceExpanded) {
            this.replaceInput.focus();
            this.replaceInput.select();
        } else {
            this.focusInput();
        }
    }

    private search(preferredIndex = 0) {
        this.clearHighlights();
        const compiled = this.buildPattern();
        if (!compiled) {
            this.updateCount();
            return;
        }

        const rendered = this.buildRenderedSearchSegments();
        this.renderedSegments = new Map(rendered.map((entry) => [entry.segment.sourceId, entry]));
        this.matches = findInDocumentSearchIndex(
            rendered.map((entry) => entry.segment),
            this.input.value,
            this.options,
        );
        this.currentIndex = this.matches.length > 0
            ? Math.min(Math.max(preferredIndex, 0), this.matches.length - 1)
            : -1;
        this.updateCurrent();
        this.updateCount();
    }

    private renderDomHighlights() {
        if (!supportsCssCustomHighlight()) {
            return;
        }
        const matchRanges: Range[] = [];
        const currentRanges: Range[] = [];
        for (let i = 0; i < this.matches.length; i++) {
            const match = this.matches[i];
            const rendered = this.getRenderedSegment(match);
            if (!rendered || rendered.kind !== "prose") {
                continue;
            }
            const range = this.getProseMatchRange(match);
            if (!range) {
                continue;
            }
            if (i === this.currentIndex) {
                currentRanges.push(range);
            } else {
                matchRanges.push(range);
            }
        }
        CSS.highlights.set(CSS_FIND_MATCH, new Highlight(...matchRanges));
        CSS.highlights.set(CSS_FIND_CURRENT, new Highlight(...currentRanges));
    }

    private clearDomHighlights() {
        if (!supportsCssCustomHighlight()) {
            return;
        }
        CSS.highlights.delete(CSS_FIND_MATCH);
        CSS.highlights.delete(CSS_FIND_CURRENT);
    }

    private updateCodeMirrorDecorations() {
        const cmMatchesByView = new Map<EditorView, Array<{ match: FindMatch; index: number }>>();
        this.matches.forEach((match, index) => {
            const rendered = this.getRenderedSegment(match);
            if (!rendered || rendered.kind !== "code") {
                return;
            }
            const view = getCodeMirrorView(rendered.block);
            if (!view) {
                return;
            }
            const matches = cmMatchesByView.get(view) || [];
            matches.push({ match, index });
            cmMatchesByView.set(view, matches);
        });

        const views = new Set<EditorView>();
        this.getContentEl()?.querySelectorAll<HTMLElement>("[data-type='code-block'], [data-type='math-block']").forEach((blockElement) => {
            const view = getCodeMirrorView(blockElement);
            if (view) {
                views.add(view);
            }
        });

        views.forEach((view) => {
            ensureFindDecorationsField(view);
            const builder = new RangeSetBuilder<Decoration>();
            const matches = cmMatchesByView.get(view) || [];
            for (const { match, index } of matches) {
                const className = index === this.currentIndex
                    ? `${HIGHLIGHT_CLASS} ${CURRENT_CLASS}`
                    : HIGHLIGHT_CLASS;
                const from = Math.max(0, Math.min(match.sourceRange.start, view.state.doc.length));
                const to = Math.max(from, Math.min(match.sourceRange.end, view.state.doc.length));
                if (from < to) {
                    builder.add(from, to, Decoration.mark({ class: className }));
                }
            }
            view.dispatch({
                effects: cmDecorationsEffect.of(builder.finish()),
            });
        });
    }

    private clearHighlights() {
        this.clearDomHighlights();
        const contentEl = this.getContentEl();
        contentEl?.querySelectorAll<HTMLElement>("[data-type='code-block'], [data-type='math-block']").forEach((blockElement) => {
            const view = getCodeMirrorView(blockElement);
            if (!view) {
                return;
            }
            ensureFindDecorationsField(view);
            view.dispatch({
                effects: cmDecorationsEffect.of(Decoration.none),
            });
        });
        this.matches = [];
        this.renderedSegments.clear();
        this.currentIndex = -1;
    }

    private navigate(dir: 1 | -1) {
        if (this.matches.length === 0) return;
        this.currentIndex = (this.currentIndex + dir + this.matches.length) % this.matches.length;
        this.updateCurrent();
        this.updateCount();
    }

    private updateCurrent() {
        const currentMatch = this.currentIndex >= 0 ? this.matches[this.currentIndex] : undefined;
        const rendered = currentMatch ? this.getRenderedSegment(currentMatch) : undefined;
        if (currentMatch && rendered?.kind === "code") {
            this.ensureCodeMirrorMatchView(currentMatch);
        }
        this.renderDomHighlights();
        this.updateCodeMirrorDecorations();
        if (currentMatch && rendered?.kind === "prose") {
            const range = this.getProseMatchRange(currentMatch);
            const editor = this.getEditorRoot();
            if (range && editor) {
                const position = createDocumentPosition({
                    mode: this.vditor.currentMode,
                    surface: currentMatch.sourceRange.surface,
                    blockKey: currentMatch.sourceRange.blockKey,
                    anchor: currentMatch.sourceRange.start,
                    head: currentMatch.sourceRange.end,
                    presentation: "edit",
                });
                setSessionDocumentPosition(this.vditor, position);
                const restored = restoreDocumentPositionInEditor(this.vditor, editor, position);
                if (restored) {
                    scrollCaretIntoEditorView(this.vditor, restored);
                } else {
                    setSelectionFocusWithAffinity(range, "forward");
                    scrollCaretIntoEditorView(this.vditor, range);
                }
            }
        } else if (currentMatch && rendered?.kind === "code") {
            this.scheduleRestoreFindFocus();
        }
    }

    private updateCount() {
        if (this.queryError) {
            this.countEl.textContent = this.queryError;
            this.countEl.classList.add("vditor-find-bar__count--none");
            return;
        }
        if (this.matches.length > 0) {
            this.countEl.textContent = `${this.currentIndex + 1} / ${this.matches.length}`;
            this.countEl.classList.remove("vditor-find-bar__count--none");
        } else {
            this.countEl.textContent = window.VditorI18n?.["find-no-result"] || "No results";
            this.countEl.classList.toggle("vditor-find-bar__count--none", !!this.input.value.trim());
        }
    }

    private replaceProseMatch(match: FindMatch) {
        const range = this.getProseMatchRange(match);
        if (!range) {
            return false;
        }
        const replacement = this.getReplacementText(match.text);
        range.deleteContents();
        range.insertNode(document.createTextNode(replacement));
        range.startContainer.parentNode?.normalize();
        setSessionDocumentPosition(this.vditor, createDocumentPosition({
            mode: this.vditor.currentMode,
            surface: match.sourceRange.surface,
            blockKey: match.sourceRange.blockKey,
            anchor: match.sourceRange.start,
            head: match.sourceRange.start + replacement.length,
            presentation: "edit",
        }));
        return true;
    }

    private replaceInlineSourceMatch(match: FindMatch, rendered: RenderedSearchSegment) {
        if (!rendered.sourceElement) {
            return false;
        }
        const source = rendered.sourceElement.textContent || "";
        const start = Math.max(0, Math.min(match.sourceRange.start, source.length));
        const end = Math.max(start, Math.min(match.sourceRange.end, source.length));
        const replacement = this.getReplacementText(source.slice(start, end));
        rendered.sourceElement.textContent = `${source.slice(0, start)}${replacement}${source.slice(end)}`;
        setSessionDocumentPosition(this.vditor, createDocumentPosition({
            mode: this.vditor.currentMode,
            surface: match.sourceRange.surface,
            blockKey: match.sourceRange.blockKey,
            anchor: start,
            head: start + replacement.length,
            presentation: "edit",
        }));
        return true;
    }

    private replaceCodeMirrorMatch(match: FindMatch) {
        const rendered = this.getRenderedSegment(match);
        if (!rendered) {
            return false;
        }
        if (!rendered.block.matches("[data-type='code-block'], [data-type='math-block']")) {
            return this.replaceInlineSourceMatch(match, rendered);
        }
        const view = this.ensureCodeMirrorMatchView(match);
        if (!view) {
            return false;
        }
        const replacement = this.getReplacementText(match.text);
        const from = Math.max(0, Math.min(match.sourceRange.start, view.state.doc.length));
        const to = Math.max(from, Math.min(match.sourceRange.end, view.state.doc.length));
        view.dispatch({
            changes: { from, to, insert: replacement },
            selection: EditorSelection.cursor(from + replacement.length),
        });
        setSessionDocumentPosition(this.vditor, createDocumentPosition({
            mode: this.vditor.currentMode,
            surface: match.sourceRange.surface,
            blockKey: match.sourceRange.blockKey,
            anchor: from,
            head: from + replacement.length,
            presentation: "edit",
        }));
        return true;
    }

    private commitFindReplace() {
        commitAuthoredEdit(this.vditor, { intent: "findReplace" });
    }

    private replaceCurrent() {
        if (this.matches.length === 0 || !this.compiledPattern) {
            return;
        }
        const index = this.currentIndex >= 0 ? this.currentIndex : 0;
        const match = this.matches[index];
        const rendered = this.getRenderedSegment(match);
        const replaced = rendered?.kind === "prose"
            ? this.replaceProseMatch(match)
            : this.replaceCodeMirrorMatch(match);
        if (!replaced) {
            return;
        }
        this.commitFindReplace();
        this.search(index);
    }

    private replaceAll() {
        if (this.matches.length === 0 || !this.compiledPattern) {
            return;
        }

        const cmChangesByView = new Map<EditorView, Array<{ from: number; to: number; insert: string }>>();
        let replacedAny = false;
        for (let i = this.matches.length - 1; i >= 0; i--) {
            const match = this.matches[i];
            const rendered = this.getRenderedSegment(match);
            if (!rendered) {
                continue;
            }
            if (rendered.kind === "prose") {
                replacedAny = this.replaceProseMatch(match) || replacedAny;
                continue;
            }
            if (!rendered.block.matches("[data-type='code-block'], [data-type='math-block']")) {
                replacedAny = this.replaceInlineSourceMatch(match, rendered) || replacedAny;
                continue;
            }
            const view = this.ensureCodeMirrorMatchView(match);
            if (!view) {
                continue;
            }
            const from = Math.max(0, Math.min(match.sourceRange.start, view.state.doc.length));
            const to = Math.max(from, Math.min(match.sourceRange.end, view.state.doc.length));
            const changes = cmChangesByView.get(view) || [];
            changes.push({ from, to, insert: this.getReplacementText(match.text) });
            cmChangesByView.set(view, changes);
        }

        cmChangesByView.forEach((changes, view) => {
            if (changes.length === 0) {
                return;
            }
            changes.sort((a, b) => a.from - b.from);
            view.dispatch({ changes });
            replacedAny = true;
        });

        if (!replacedAny) {
            return;
        }
        this.commitFindReplace();
        this.search();
    }

    public focusInput() {
        this.activeFindField = this.input;
        this.input.focus();
        this.input.select();
    }

    public focusReplaceInput() {
        this.activeFindField = this.replaceInput;
        this.setReplaceExpanded(true);
        this.replaceInput.focus();
        this.replaceInput.select();
    }

    public show(shouldFocusInput = false) {
        this.element.style.display = "flex";
        this.setReplaceExpanded(false);
        this.activeFindField = this.input;
        this.bindEditorRefresh();
        if (this.input.value.trim()) {
            this.search();
        } else {
            this.updateCount();
        }
        if (shouldFocusInput) {
            this.focusInput();
        }
    }

    public showReplace() {
        this.element.style.display = "flex";
        this.bindEditorRefresh();
        if (this.input.value.trim()) {
            this.search();
        } else {
            this.updateCount();
        }
        this.setReplaceExpanded(true);
        this.focusInput();
    }

    public hide() {
        this.element.style.display = "none";
        this.setReplaceExpanded(false);
        this.findComposing = false;
        this.cancelRestoreFindFocus();
        this.unbindEditorRefresh();
        this.clearHighlights();
    }

    public toggle(shouldFocusInput = false) {
        if (this.isVisible()) {
            this.hide();
        } else {
            this.show(shouldFocusInput);
        }
    }

    public isVisible() {
        return this.element.style.display === "flex";
    }
}
