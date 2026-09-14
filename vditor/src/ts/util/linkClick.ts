import { isInsideCodeBlockChrome, isInsideCodeMirror, isPlantumlRenderImage } from "../codeBlock/codeMirrorManager";
import { hasClosestByAttribute, hasClosestByMatchTag } from "./hasClosest";
import {
    createDocumentTarget,
    createDocumentTargetFocusAnchor,
    getDocumentTargetActivation,
    type DocumentTarget,
    type DocumentTargetField,
    type DocumentTargetGesture,
    type DocumentTargetKind,
} from "./documentTarget";
import {
    getDocumentPositionFromRange,
    restoreDocumentPositionInEditor,
} from "./selection";
import { setSessionDocumentPosition } from "./documentPosition";

type ResolvedLinkType = "link" | "link-ref" | "wikilink" | "wikilink-embed" | "image";

export type ResolvedDocumentTarget = {
    target: DocumentTarget;
    element: HTMLElement;
    /** Kept separate from target.kind for the existing onLinkClick API. */
    type: ResolvedLinkType;
    href: string;
    text: string;
};

const rangeFor = (value: string) => ({ start: 0, end: value.length });

const sourceWithRanges = (display: string, destination: string, source = destination) => ({
    display,
    destination,
    source,
    displayRange: rangeFor(display),
    destinationRange: rangeFor(destination),
    sourceRange: rangeFor(source),
});

const getEditorElement = (vditor: IVditor): HTMLElement | null => {
    if (vditor.currentMode !== "wysiwyg" && vditor.currentMode !== "ir") {
        return null;
    }
    return vditor[vditor.currentMode]?.element || null;
};

/** Create the ADR 0010 position used as the object's semantic focus anchor. */
export const getDocumentTargetFocusPosition = (
    vditor: IVditor,
    element: HTMLElement,
) => {
    const editor = getEditorElement(vditor);
    if (!editor || !element.isConnected || !editor.contains(element)) {
        return null;
    }
    const range = editor.ownerDocument.createRange();
    if (element.getAttribute("data-type") === "html-block") {
        range.selectNodeContents(element);
        range.collapse(false);
    } else {
        range.setStartAfter(element);
        range.collapse(true);
    }
    return getDocumentPositionFromRange(vditor, editor, range, { preferRangeEndpoints: true });
};

/**
 * Restore once through ADR 0010. The live element is only used to refresh the
 * logical position after a source edit; DOM identity is never the authority.
 */
export const restoreDocumentTargetFocus = (
    vditor: IVditor,
    target: DocumentTarget,
    element?: HTMLElement | null,
) => {
    const editor = getEditorElement(vditor);
    if (!editor) {
        return false;
    }
    const position = element && element.isConnected
        ? getDocumentTargetFocusPosition(vditor, element)
        : null;
    const anchor = position || target.focusAnchor?.position;
    if (!anchor) {
        return false;
    }
    setSessionDocumentPosition(vditor, anchor);
    editor.focus({ preventScroll: true });
    return !!restoreDocumentPositionInEditor(vditor, editor, anchor);
};

const splitWikiDestination = (destination: string) => {
    const hash = destination.indexOf("#");
    return hash < 0
        ? { path: destination, fragment: "" }
        : { path: destination.slice(0, hash), fragment: destination.slice(hash + 1) };
};

const getWikiDisplay = (element: HTMLElement, destination: string) =>
    element.querySelector<HTMLElement>(".vditor-wikilink__display")?.textContent?.trim()
    || (element.classList.contains("obsidian-wikilink") ? element.textContent?.trim() : "")
    || splitWikiDestination(destination).path
    || destination;

const getWikiSource = (element: HTMLElement, destination: string) =>
    element.querySelector<HTMLElement>(".vditor-wikilink__source")?.textContent?.trim()
    || destination;

const getResolvedHref = (element: HTMLAnchorElement, rawHref: string) =>
    rawHref.startsWith("#") ? rawHref : element.href || rawHref;

const getHostOpen = (uri: string, kind: "wiki" | "external" = "external") => {
    if (!uri) {
        return null;
    }
    if (uri.startsWith("#")) {
        return { kind: "fragment" as const, uri };
    }
    return { kind, uri };
};

const focusAnchorFor = (vditor: IVditor, element: HTMLElement, edge: "after" | "content" = "after") => {
    const position = getDocumentTargetFocusPosition(vditor, element);
    return position ? createDocumentTargetFocusAnchor(position, edge) : null;
};

const createLinkTarget = (
    vditor: IVditor,
    element: HTMLAnchorElement,
): DocumentTarget => {
    const rawHref = element.getAttribute("href") || element.getAttribute("data-href") || "";
    const resolvedHref = getResolvedHref(element, rawHref);
    const display = element.textContent?.trim() || rawHref;
    const fields: DocumentTargetField[] = [
        { name: "display", value: display, sourceRange: rangeFor(display) },
        { name: "destination", value: rawHref, sourceRange: rangeFor(rawHref) },
    ];
    return createDocumentTarget({
        kind: "link",
        source: sourceWithRanges(display, rawHref, rawHref),
        editableFields: fields,
        hostOpen: getHostOpen(resolvedHref),
        focusAnchor: focusAnchorFor(vditor, element),
    });
};

const createLinkRefTarget = (vditor: IVditor, element: HTMLElement): DocumentTarget => {
    const display = element.tagName === "IMG"
        ? element.getAttribute("alt") || ""
        : element.textContent?.trim() || "";
    const reference = element.getAttribute("data-link-label") || "";
    return createDocumentTarget({
        kind: "link-ref",
        source: sourceWithRanges(display, reference, reference),
        editableFields: [
            { name: "display", value: display, sourceRange: rangeFor(display) },
            { name: "reference", value: reference, sourceRange: rangeFor(reference) },
        ],
        focusAnchor: focusAnchorFor(vditor, element),
    });
};

const createWikiTarget = (
    vditor: IVditor,
    element: HTMLElement,
    kind: "wikilink" | "wikilink-embed",
): DocumentTarget => {
    const destination = element.getAttribute("data-href") || element.dataset.href || "";
    const display = getWikiDisplay(element, destination);
    const source = getWikiSource(element, destination);
    const { path, fragment } = splitWikiDestination(destination);
    const hostOpen = destination
        ? getHostOpen(destination.startsWith("#") ? destination : `wiki:${destination}`, "wiki")
        : null;
    return createDocumentTarget({
        kind,
        source: sourceWithRanges(display, destination, source),
        editableFields: [
            { name: "display", value: display, sourceRange: rangeFor(display) },
            { name: "path", value: path, sourceRange: rangeFor(path) },
            { name: "fragment", value: fragment, sourceRange: rangeFor(fragment) },
        ],
        hostOpen,
        focusAnchor: focusAnchorFor(vditor, element),
    });
};

const decodeMdSource = (raw: string | null) => (raw || "").replaceAll("_esc_newline_", "\n");

const createHtmlTarget = (
    vditor: IVditor,
    element: HTMLElement,
    kind: "html-inline" | "html-block",
): DocumentTarget => {
    const source = kind === "html-block"
        ? decodeMdSource(element.getAttribute("data-md-source"))
            || element.querySelector("code[data-type='html-block'], pre code")?.textContent?.trim() || ""
        : decodeMdSource(element.getAttribute("data-md-source"));
    const display = element.querySelector<HTMLElement>(".vditor-html-inline__display, .vditor-html-block__display")
        ?.textContent?.trim() || element.textContent?.trim() || source;
    return createDocumentTarget({
        kind,
        source: sourceWithRanges(display, "", source),
        editableFields: [{ name: "source", value: source, sourceRange: rangeFor(source) }],
        focusAnchor: focusAnchorFor(vditor, element, kind === "html-block" ? "content" : "after"),
    });
};

const inferTargetKind = (element: HTMLElement): DocumentTargetKind | null => {
    const type = element.getAttribute("data-type");
    if (type === "link-ref") {
        return "link-ref";
    }
    if (type === "wikilink" || type === "wikilink-embed") {
        return type;
    }
    if (type === "html-inline" || type === "html-block") {
        return type;
    }
    if (element.tagName === "IMG") {
        return "image";
    }
    if (element.tagName === "A" || type === "a") {
        return "link";
    }
    return null;
};

/** Build the shared target for toolbar, HTML, wiki, and link-click adapters. */
export const createDocumentTargetForElement = (vditor: IVditor, input: HTMLElement): DocumentTarget | null => {
    const element = input.closest?.(
        "[data-type='link-ref'], [data-type='wikilink'], [data-type='wikilink-embed'], [data-type='html-inline'], [data-type='html-block'], a, img, [data-type='a']",
    ) as HTMLElement | null || input;
    const kind = inferTargetKind(element);
    if (!kind) {
        return null;
    }
    if (kind === "link") {
        return createLinkTarget(vditor, element as HTMLAnchorElement);
    }
    if (kind === "link-ref") {
        return createLinkRefTarget(vditor, element);
    }
    if (kind === "wikilink" || kind === "wikilink-embed") {
        return createWikiTarget(vditor, element, kind);
    }
    if (kind === "image") {
        const img = element as HTMLImageElement;
        const parentA = hasClosestByMatchTag(img, "A") as HTMLAnchorElement | false;
        const rawSrc = img.getAttribute("src") || img.currentSrc || img.src || "";
        const resolvedHref = parentA
            ? getResolvedHref(parentA, parentA.getAttribute("href") || "")
            : img.currentSrc || img.src || rawSrc;
        const display = img.alt || rawSrc;
        return createDocumentTarget({
            kind: "image",
            source: sourceWithRanges(display, rawSrc, rawSrc),
            editableFields: [
                { name: "alt", value: img.alt || "", sourceRange: rangeFor(img.alt || "") },
                { name: "destination", value: rawSrc, sourceRange: rangeFor(rawSrc) },
            ],
            hostOpen: getHostOpen(resolvedHref),
            focusAnchor: focusAnchorFor(vditor, img),
        });
    }
    return createHtmlTarget(vditor, element, kind);
};

const getWikilinkElement = (target: HTMLElement) => {
    if (target.dataset?.type === "wikilink" || target.dataset?.type === "wikilink-embed") {
        return target;
    }
    return target.closest?.("[data-type='wikilink'], [data-type='wikilink-embed'], .obsidian-wikilink, .obsidian-wikilink-embed") as HTMLElement | null;
};

/** Resolve an event target to the shared model without deciding the gesture. */
export const resolveDocumentTargetFromTarget = (
    target: EventTarget | null,
    vditor: IVditor,
): ResolvedDocumentTarget | null => {
    if (!target || !(target instanceof HTMLElement)) {
        return null;
    }
    if (isInsideCodeMirror(target) || isInsideCodeBlockChrome(target)) {
        return null;
    }

    const html = hasClosestByAttribute(target, "data-type", "html-inline")
        || hasClosestByAttribute(target, "data-type", "html-block");
    if (html && html.getAttribute("contenteditable") === "false") {
        const htmlElement = html as HTMLElement;
        const kind = htmlElement.getAttribute("data-type") as "html-inline" | "html-block";
        return {
            target: createHtmlTarget(vditor, htmlElement, kind),
            element: htmlElement,
            type: "link",
            href: "",
            text: htmlElement.textContent?.trim() || "",
        };
    }

    const linkRef = hasClosestByAttribute(target, "data-type", "link-ref");
    if (linkRef) {
        const element = linkRef as HTMLElement;
        const documentTarget = createLinkRefTarget(vditor, element);
        return {
            target: documentTarget,
            element,
            type: "link-ref",
            href: element.getAttribute("data-link-label") || element.textContent?.trim() || "",
            text: documentTarget.source.display,
        };
    }

    const wiki = getWikilinkElement(target);
    if (wiki) {
        const isEmbed = wiki.dataset?.type === "wikilink-embed"
            || wiki.classList.contains("obsidian-wikilink-embed")
            || wiki.classList.contains("vditor-wikilink-embed");
        const kind = isEmbed ? "wikilink-embed" : "wikilink";
        const documentTarget = createWikiTarget(vditor, wiki, kind);
        return {
            target: documentTarget,
            element: wiki,
            type: kind,
            href: documentTarget.source.destination,
            text: documentTarget.source.display,
        };
    }

    if (target.tagName === "IMG" && !isPlantumlRenderImage(target)) {
        const element = target as HTMLImageElement;
        const documentTarget = createDocumentTargetForElement(vditor, element);
        if (documentTarget) {
            const parentA = hasClosestByMatchTag(element, "A") as HTMLAnchorElement | false;
            return {
                target: documentTarget,
                element,
                type: parentA ? "link" : "image",
                href: parentA
                    ? getResolvedHref(parentA, parentA.getAttribute("href") || "")
                    : element.currentSrc || element.src,
                text: element.alt || documentTarget.source.destination,
            };
        }
    }

    const aElement = hasClosestByMatchTag(target, "A") as HTMLAnchorElement | false;
    if (aElement) {
        const rawHref = aElement.getAttribute("href") || "";
        if (rawHref && rawHref !== "#") {
            const documentTarget = createLinkTarget(vditor, aElement);
            return {
                target: documentTarget,
                element: aElement,
                type: "link",
                href: getResolvedHref(aElement, rawHref),
                text: aElement.textContent?.trim() || rawHref,
            };
        }
    }

    const irAnchor = hasClosestByAttribute(target, "data-type", "a") as HTMLElement | false;
    if (irAnchor) {
        const documentTarget = createLinkTarget(vditor, irAnchor as HTMLAnchorElement);
        return {
            target: documentTarget,
            element: irAnchor,
            type: "link",
            href: documentTarget.source.destination,
            text: documentTarget.source.display,
        };
    }

    if (vditor.currentMode === "ir" && target.classList.contains("vditor-ir__marker--link")) {
        const value = target.textContent?.trim() || "";
        const documentTarget = createDocumentTarget({
            kind: "link",
            source: sourceWithRanges(value, value),
            editableFields: [{ name: "destination", value }],
            focusAnchor: focusAnchorFor(vditor, target),
        });
        return {
            target: documentTarget,
            element: target,
            type: "link",
            href: value,
            text: value,
        };
    }

    return null;
};

export const getDocumentTargetGesture = (event: MouseEvent): DocumentTargetGesture => {
    if (event.type === "auxclick") {
        return "auxclick";
    }
    if (event.type === "dblclick" || event.detail > 1) {
        return "dblclick";
    }
    if (event.metaKey || event.ctrlKey) {
        return "modified-click";
    }
    return "click";
};

export const shouldEditDocumentTarget = (target: DocumentTarget, event: MouseEvent) =>
    getDocumentTargetActivation(target, getDocumentTargetGesture(event)) === "edit";

export const resolveLinkClickFromTarget = (
    target: EventTarget | null,
    vditor: IVditor,
): (Omit<ILinkClickPayload, "action" | "target"> & { target?: DocumentTarget }) | null => {
    const resolved = resolveDocumentTargetFromTarget(target, vditor);
    if (resolved) {
        return {
            type: resolved.type,
            href: resolved.href,
            text: resolved.text,
            element: resolved.element,
            target: resolved.target,
        };
    }
    if (!target || !(target instanceof HTMLElement)) {
        return null;
    }
    if (isInsideCodeMirror(target) || isInsideCodeBlockChrome(target)) {
        return null;
    }
    const footnoteRef = hasClosestByAttribute(target, "data-type", "footnotes-ref");
    if (footnoteRef) {
        const label = footnoteRef.getAttribute("data-footnotes-label") || footnoteRef.textContent?.trim() || "";
        if (label) {
            return { type: "footnote-ref", href: label, text: label, element: footnoteRef as HTMLElement };
        }
    }
    const tagEl = hasClosestByAttribute(target, "data-type", "obsidian-tag")
        || target.closest?.(".vditor-obsidian-tag, .obsidian-tag") as HTMLElement | null;
    if (tagEl) {
        const text = tagEl.textContent?.trim() || "";
        const href = text.startsWith("#") ? text.slice(1) : text;
        if (href) {
            return { type: "tag", href, text, element: tagEl };
        }
    }
    return null;
};

/** 未配置 onLinkClick 时：修饰键单击、双击或中键触发默认跳转。 */
export const shouldTriggerLinkClick = (event: MouseEvent) => {
    if (event.type === "auxclick" || event.type === "dblclick") {
        return true;
    }
    if (event.type === "click" && (event.metaKey || event.ctrlKey)) {
        return true;
    }
    return false;
};

const getLinkClickAction = (event: MouseEvent): ILinkClickAction => {
    if (event.type === "dblclick" || event.detail > 1) {
        return "dblclick";
    }
    if (event.type === "auxclick") {
        return "auxclick";
    }
    return "click";
};

const defaultLinkClickBehavior = (payload: ILinkClickPayload) => {
    const href = payload.target?.hostOpen?.uri || payload.href;
    if (!href) {
        return;
    }
    if (/^https?:\/\//i.test(href) || href.startsWith("file:")) {
        window.open(href, "_blank");
        return;
    }
    if (href.startsWith("#")) {
        const id = href.slice(1);
        const anchor = document.getElementById(id);
        anchor?.scrollIntoView({ block: "center" });
    }
};

export const linkClickEvent = (vditor: IVditor, editorElement: HTMLElement) => {
    const onPointer = (event: MouseEvent) => {
        const payload = resolveLinkClickFromTarget(event.target, vditor);
        if (!payload) {
            return;
        }

        if (event.type === "dblclick" && payload.type === "image") {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (payload.target && getDocumentTargetActivation(
            payload.target,
            getDocumentTargetGesture(event),
        ) !== "host-open") {
            return;
        }

        const onLinkClick = vditor.options.onLinkClick;
        if (typeof onLinkClick === "function") {
            onLinkClick({
                ...payload,
                action: getLinkClickAction(event),
                gesture: payload.target ? getDocumentTargetGesture(event) : undefined,
            }, event, vditor);
            return;
        }

        if (!shouldTriggerLinkClick(event)) {
            return;
        }
        defaultLinkClickBehavior({
            ...payload,
            action: getLinkClickAction(event),
        });
    };

    // 冒泡阶段，与 util.openLink 一致：先让 pre 内 Vditor UI 处理，再拦截向外传播
    editorElement.addEventListener("click", onPointer);
    editorElement.addEventListener("auxclick", onPointer);
    editorElement.addEventListener("dblclick", onPointer);
};

