import {Constants} from "../constants";
import {disableToolbar} from "../toolbar/setToolbar";
import {enableToolbar} from "../toolbar/setToolbar";
import {removeCurrentToolbar} from "../toolbar/setToolbar";
import {setCurrentToolbar} from "../toolbar/setToolbar";
import {isCtrl, updateHotkeyTip, formatAltEnterHotkeyTip} from "../util/compatibility";
import {
    hasClosestByAttribute,
    hasClosestByClassName,
    hasClosestByMatchTag,
} from "../util/hasClosest";
import {
    hasClosestByHeadings,
    hasClosestByTag,
} from "../util/hasClosestByHeadings";
import {
    focusCodeMirror,
    isCmCodeBlock,
    isInsideCodeBlockChrome,
    isInsideCodeMirror,
    isPlantumlRenderImage,
    isSpecialBlock,
    CM_EDITING_CLASS,
    syncMathBlocksDisplayMode,
} from "../codeBlock/codeMirrorManager";
import {getModeEditorElement, getModePopover} from "../codeBlock/codeBlockLanguagePopover";
import {
    getEditorRange,
    selectIsEditor,
    setRangeByWbr,
    setSelectionFocus,
} from "../util/selection";
import {afterRenderEvent} from "./afterRenderEvent";
import {removeBlockElement} from "./processKeydown";
import {updateActiveHeadingMarker} from "../util/updateActiveHeadingMarker";
import {showToast} from "../ui/toast";
import {codicon} from "../util/codicon";
import {updateBlockHandle} from "./blockHandle";
import {updateTableHandle} from "./tableHandle";
import {resolveAdjacentElementFromRange} from "../util/rangeAdjacentElement";
import {normalizeLinkDestInput} from "../util/linkDest";
import {commitAuthoredEdit} from "../util/editTransaction";
import {
    createDocumentTargetForElement,
    restoreDocumentTargetFocus,
} from "../util/linkClick";
import type {DocumentTarget} from "../util/documentTarget";

type LinkPopoverBinding = {
    element: HTMLElement;
    target: DocumentTarget;
    commit: () => void;
    cancel: () => void;
};

type LinkPopoverElement = HTMLDivElement & {
    _sourceElement?: HTMLElement;
    _documentTargetBinding?: LinkPopoverBinding;
};

const getLinkPopoverBinding = (vditor: IVditor): LinkPopoverBinding | null =>
    (getModePopover(vditor) as LinkPopoverElement | null)?._documentTargetBinding || null;

const hideLinkPopoverOnly = (vditor: IVditor) => {
    if (vditor.currentMode === "wysiwyg" || vditor.currentMode === "ir") {
        clearTimeout(vditor[vditor.currentMode].hlToolbarTimeoutId);
    }
    const popover = getModePopover(vditor) as LinkPopoverElement | null;
    if (!popover) {
        return;
    }
    popover.style.position = "";
    popover.style.display = "none";
    delete popover._sourceElement;
    delete popover._documentTargetBinding;
};

export const hideLinkPopover = (vditor: IVditor) => {
    const binding = getLinkPopoverBinding(vditor);
    if (binding) {
        // Losing the selection by clicking elsewhere is a normal close: keep
        // the edits and put one semantic commit around the whole popover.
        binding.commit();
    }
    hideLinkPopoverOnly(vditor);
};

export const getPopoverSourceElement = (vditor: IVditor): HTMLElement | null => {
    const popover = getModePopover(vditor) as LinkPopoverElement | null;
    return popover?._sourceElement ?? null;
};

export const isElementVisibleInEditorViewport = (editorElement: HTMLElement, element: HTMLElement) => {
    const elementRect = element.getClientRects()[0] || element.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const viewportTop = Math.max(0, editorRect.top);
    const viewportBottom = Math.min(window.innerHeight, editorRect.bottom);
    const viewportLeft = Math.max(0, editorRect.left);
    const viewportRight = Math.min(window.innerWidth, editorRect.right);

    return elementRect.bottom > viewportTop &&
        elementRect.top < viewportBottom &&
        elementRect.right > viewportLeft &&
        elementRect.left < viewportRight;
};

/** 退出链接/图片编辑弹窗，光标回到元素后（与 Alt+Enter 一致） */
export const exitLinkPopoverToElement = (vditor: IVditor, element: HTMLElement, commit = false) => {
    const binding = getLinkPopoverBinding(vditor);
    if (binding && binding.element === element) {
        (commit ? binding.commit : binding.cancel)();
        return;
    }
    hideLinkPopoverOnly(vditor);
    const editorElement = getModeEditorElement(vditor);
    if (!editorElement) {
        return;
    }
    focusEditorWithoutScroll(editorElement);
    const range = getEditorRange(vditor);
    element.insertAdjacentHTML("afterend", Constants.ZWSP);
    range.setStartAfter(element.nextSibling as Node);
    range.collapse(true);
    setSelectionFocus(range);
};

const bindLinkPopover = (
    vditor: IVditor,
    element: HTMLElement,
    target: DocumentTarget,
    commit: () => void,
    cancel: () => void,
) => {
    const popover = getModePopover(vditor) as LinkPopoverElement | null;
    if (popover) {
        popover._documentTargetBinding = { element, target, commit, cancel };
    }
};

const closeLinkPopover = (
    vditor: IVditor,
    target: DocumentTarget,
    element: HTMLElement,
    mutate: () => void,
) => {
    mutate();
    hideLinkPopoverOnly(vditor);
    restoreDocumentTargetFocus(vditor, target, element);
};

const focusEditorWithoutScroll = (editor: HTMLElement) => {
    editor.focus({ preventScroll: true });
};

const createLinkPopoverExitHint = () => {
    const hint = document.createElement("span");
    hint.className = "vditor-link-popover__hint";
    hint.textContent = formatAltEnterHotkeyTip();
    return hint;
};

export const highlightToolbarWYSIWYG = (vditor: IVditor) => {
    clearTimeout(vditor.wysiwyg.hlToolbarTimeoutId);
    vditor.wysiwyg.hlToolbarTimeoutId = 0;
    let range: Range | undefined;
    try {
        if (
            vditor.wysiwyg.element.getAttribute("contenteditable") === "false"
        ) {
            return;
        }
        if (!selectIsEditor(vditor.wysiwyg.element)) {
            return;
        }
        if (isInsideCodeBlockChrome(document.activeElement)) {
            return;
        }

        removeCurrentToolbar(vditor.toolbar.elements, Constants.EDIT_TOOLBARS);
        enableToolbar(vditor.toolbar.elements, Constants.EDIT_TOOLBARS);

        range = getSelection().getRangeAt(0);
        let typeElement = range.startContainer as HTMLElement;
        if (range.startContainer.nodeType === 3) {
            typeElement = range.startContainer.parentElement;
        } else {
            typeElement = typeElement.childNodes[
                range.startOffset >= typeElement.childNodes.length
                    ? typeElement.childNodes.length - 1
                    : range.startOffset
                ] as HTMLElement;
        }

        const footnotesElement = hasClosestByAttribute(typeElement, "data-type", "footnotes-block");
        if (footnotesElement) {
            return;
        }

        // 工具栏高亮和禁用
        const liElement = hasClosestByMatchTag(typeElement, "LI");
        if (liElement) {
            if (liElement.classList.contains("vditor-task")) {
                setCurrentToolbar(vditor.toolbar.elements, ["check"]);
            } else if (liElement.parentElement.tagName === "OL") {
                setCurrentToolbar(vditor.toolbar.elements, ["ordered-list"]);
            } else if (liElement.parentElement.tagName === "UL") {
                setCurrentToolbar(vditor.toolbar.elements, ["list"]);
            }
            enableToolbar(vditor.toolbar.elements, ["outdent", "indent"]);
        } else {
            disableToolbar(vditor.toolbar.elements, ["outdent", "indent"]);
        }

        if (hasClosestByMatchTag(typeElement, "BLOCKQUOTE")) {
            setCurrentToolbar(vditor.toolbar.elements, ["quote"]);
        }

        if (
            hasClosestByMatchTag(typeElement, "B") ||
            hasClosestByMatchTag(typeElement, "STRONG")
        ) {
            setCurrentToolbar(vditor.toolbar.elements, ["bold"]);
        }

        if (
            hasClosestByMatchTag(typeElement, "I") ||
            hasClosestByMatchTag(typeElement, "EM")
        ) {
            setCurrentToolbar(vditor.toolbar.elements, ["italic"]);
        }

        if (
            hasClosestByMatchTag(typeElement, "STRIKE") ||
            hasClosestByMatchTag(typeElement, "S")
        ) {
            setCurrentToolbar(vditor.toolbar.elements, ["strike"]);
        }

        const aElement = hasClosestByMatchTag(typeElement, "A");
        if (aElement) {
            setCurrentToolbar(vditor.toolbar.elements, ["link"]);
        }
        const linkRefElement = hasClosestByAttribute(typeElement, "data-type", "link-ref");
        const isLinkPopoverVisible = vditor.wysiwyg.popover.style.display === "block" &&
            vditor.wysiwyg.popover.classList.contains("vditor-panel--link");
        if (isLinkPopoverVisible && !aElement && !linkRefElement) {
            hideLinkPopover(vditor);
        }
        const tableElement = hasClosestByMatchTag(typeElement, "TABLE") as HTMLTableElement;
        const headingElement = hasClosestByHeadings(typeElement) as HTMLElement;
        if (hasClosestByMatchTag(typeElement, "CODE")) {
            if (hasClosestByMatchTag(typeElement, "PRE")) {
                disableToolbar(vditor.toolbar.elements, [
                    "headings",
                    "bold",
                    "italic",
                    "strike",
                    "line",
                    "quote",
                    "list",
                    "ordered-list",
                    "check",
                    "code",
                    "inline-code",
                    "upload",
                    "link",
                    "table",
                ]);
                setCurrentToolbar(vditor.toolbar.elements, ["code"]);
            } else {
                disableToolbar(vditor.toolbar.elements, [
                    "headings",
                    "bold",
                    "italic",
                    "strike",
                    "line",
                    "quote",
                    "list",
                    "ordered-list",
                    "check",
                    "code",
                    "upload",
                    "link",
                    "table",
                ]);
                setCurrentToolbar(vditor.toolbar.elements, ["inline-code"]);
            }
        } else if (headingElement) {
            disableToolbar(vditor.toolbar.elements, ["bold"]);
            setCurrentToolbar(vditor.toolbar.elements, ["headings"]);
        } else if (tableElement) {
            disableToolbar(vditor.toolbar.elements, ["table"]);
            if (!aElement && !linkRefElement) {
                vditor.wysiwyg.popover.style.display = "none";
            }
        }

        // quote popover
        const blockquoteElement = hasClosestByTag(typeElement, "BLOCKQUOTE") as HTMLTableElement;

        // footnote popover
        const footnotesRefElement = hasClosestByAttribute(typeElement, "data-type", "footnotes-ref");
        if (footnotesRefElement) {
            const lang: keyof II18n | "" = vditor.options.lang;
            const options: IOptions = vditor.options;
            vditor.wysiwyg.popover.innerHTML = "";

            const inputWrap = document.createElement("span");
            inputWrap.setAttribute("aria-label", window.VditorI18n.footnoteRef + "<" + updateHotkeyTip("⌥Enter") + ">");
            inputWrap.className = "vditor-tooltipped vditor-tooltipped__n";
            const input = document.createElement("input");
            inputWrap.appendChild(input);
            input.className = "vditor-input";
            input.setAttribute("placeholder", window.VditorI18n.footnoteRef + "<" + updateHotkeyTip("⌥Enter") + ">");
            input.style.width = "120px";
            input.value = footnotesRefElement.getAttribute("data-footnotes-label");
            input.oninput = () => {
                if (input.value.trim() !== "") {
                    footnotesRefElement.setAttribute("data-footnotes-label", input.value);
                }
            };
            input.onkeydown = (event) => {
                if (event.isComposing) {
                    return;
                }
                if (
                    !isCtrl(event) &&
                    !event.shiftKey &&
                    event.altKey &&
                    event.key === "Enter"
                ) {
                    range.selectNodeContents(footnotesRefElement);
                    range.collapse(false);
                    setSelectionFocus(range);
                    event.preventDefault();
                    return;
                }
                removeBlockElement(vditor, event);
            };

            vditor.wysiwyg.popover.insertAdjacentElement("beforeend", inputWrap);
            setPopoverPosition(vditor, footnotesRefElement);
        }

        // block popover: math-inline, math-block, html-block, html-inline, code-block, html-entity
        let blockRenderElement: HTMLElement | false = hasClosestByClassName(typeElement, "vditor-wysiwyg__block");
        if (!blockRenderElement && isInsideCodeMirror(typeElement)) {
            blockRenderElement = (hasClosestByAttribute(typeElement, "data-type", "code-block")
                || hasClosestByAttribute(typeElement, "data-type", "math-block")) as HTMLElement;
        }
        const blockType = blockRenderElement !== false ? (blockRenderElement.getAttribute("data-type") ?? "") : "";
        const isBlock = blockType.endsWith("-block");
        syncMathBlocksDisplayMode(vditor.wysiwyg.element, vditor);
        vditor.wysiwyg.element
            .querySelectorAll(".vditor-wysiwyg__preview")
            .forEach((itemElement) => {
                const block = itemElement.closest(
                    "[data-type='code-block'], [data-type='math-block']",
                ) as HTMLElement;
                const previousElement = itemElement.previousElementSibling as HTMLElement;
                if (!previousElement) {
                    return;
                }
                if (block) {
                    if (isSpecialBlock(block)) {
                        if (block.classList.contains(CM_EDITING_CLASS)) {
                            return;
                        }
                        previousElement.style.display = "none";
                        return;
                    }
                    if (isCmCodeBlock(block)) {
                        return;
                    }
                }
                if (!blockRenderElement || (blockRenderElement !== false && isBlock && !blockRenderElement.contains(itemElement))) {
                    previousElement.style.display = "none";
                }
            });
        if (!(blockRenderElement !== false && isBlock)) {
            blockRenderElement = false;
        }
        if (headingElement) {
            vditor.wysiwyg.popover.style.display = "none";
        }

        const tocElement = hasClosestByClassName(typeElement, "vditor-toc") as HTMLElement;

        if (
            !blockquoteElement &&
            !liElement &&
            !tableElement &&
            !blockRenderElement &&
            !aElement &&
            !linkRefElement &&
            !footnotesRefElement &&
            !headingElement &&
            !tocElement
        ) {
            vditor.wysiwyg.popover.style.display = "none";
        }

        // 反斜杠特殊处理
        vditor.wysiwyg.element
            .querySelectorAll('span[data-type="backslash"] > span')
            .forEach((item: HTMLElement) => {
                item.style.display = "none";
            });
        const backslashElement = hasClosestByAttribute(range.startContainer, "data-type", "backslash");
        if (backslashElement) {
            backslashElement.querySelector("span").style.display = "inline";
        }
        } finally {
            updateActiveHeadingMarker(vditor);
            updateBlockHandle(vditor, range?.startContainer);
            updateTableHandle(vditor);
        }
    
};

const setPopoverPosition = (vditor: IVditor, element: HTMLElement, popoverType?: "link" | "link-ref" | "image") => {
    const popover = getModePopover(vditor);
    const editorElement = getModeEditorElement(vditor);
    if (!popover || !editorElement) {
        return;
    }
    (popover as { _sourceElement?: HTMLElement })._sourceElement = element;
    popover.style.position = "absolute";
    const isLinkPanel = popoverType === "link" || popoverType === "link-ref" || popoverType === "image";
    popover.classList.toggle("vditor-panel--link", isLinkPanel);
    popover.classList.toggle("vditor-panel--link-ref", popoverType === "link-ref");
    popover.classList.toggle("vditor-panel--image", popoverType === "image");
    popover.style.left = "0";
    popover.style.display = "block";

    const elementRect = element.getClientRects()[0] || element.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const anchorTop = elementRect.top - editorRect.top + editorElement.scrollTop;
    const anchorLeft = elementRect.left - editorRect.left + editorElement.scrollLeft;
    const popoverTop = anchorTop - (isLinkPanel ? popover.clientHeight + 8 : 21);
    const maxLeft = editorElement.clientWidth - popover.clientWidth;

    popover.style.top = `${Math.max(-8, popoverTop - editorElement.scrollTop)}px`;
    popover.style.left = `${Math.max(0, Math.min(anchorLeft - editorElement.scrollLeft, maxLeft))}px`;
    popover.setAttribute("data-top", popoverTop.toString());
};

export const repositionEditPopover = (vditor: IVditor, element: HTMLElement) => {
    const popover = getModePopover(vditor);
    if (!popover) {
        return;
    }
    if (popover.classList.contains("vditor-panel--link-ref")) {
        setPopoverPosition(vditor, element, "link-ref");
        return;
    }
    if (popover.classList.contains("vditor-panel--image")) {
        setPopoverPosition(vditor, element, "image");
        return;
    }
    if (popover.classList.contains("vditor-panel--link")) {
        setPopoverPosition(vditor, element, "link");
    }
};

export const genLinkRefPopover = (vditor: IVditor, linkRefElement: HTMLElement) => {
    const popover = getModePopover(vditor);
    if (!popover) {
        return;
    }
    const documentTarget = createDocumentTargetForElement(vditor, linkRefElement);
    if (!documentTarget) {
        return;
    }
    (popover as LinkPopoverElement)._sourceElement = linkRefElement;
    popover.innerHTML = "";

    const getDisplayText = () => {
        if (linkRefElement.tagName === "IMG") {
            return linkRefElement.getAttribute("alt") || "";
        }
        return linkRefElement.textContent || "";
    };

    const initialDisplay = getDisplayText();
    const initialReference = linkRefElement.getAttribute("data-link-label") || "";

    const setDisplayText = (value: string) => {
        if (linkRefElement.tagName === "IMG") {
            linkRefElement.setAttribute("alt", value);
            return;
        }
        linkRefElement.textContent = value;
    };

    const updateText = () => {
        if (textInput.value.trim() !== "") {
            setDisplayText(textInput.value);
        }
    };

    const updateRef = () => {
        linkRefElement.setAttribute("data-link-label", refInput.value);
    };

    const copyRef = async (): Promise<boolean> => {
        const text = textInput.value;
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
                return false;
            }
        }
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        return copied;
    };

    const removeLinkRef = () => {
        const childNodes = Array.from(linkRefElement.childNodes);
        let focusNode: Node = linkRefElement;
        if (linkRefElement.tagName === "IMG") {
            focusNode = document.createTextNode(linkRefElement.getAttribute("alt") || "");
            linkRefElement.parentElement?.insertBefore(focusNode, linkRefElement);
        } else if (childNodes.length > 0) {
            for (const node of childNodes) {
                focusNode = node;
                linkRefElement.parentElement?.insertBefore(node, linkRefElement);
            }
        } else {
            focusNode = document.createTextNode(linkRefElement.textContent || "");
            linkRefElement.parentElement?.insertBefore(focusNode, linkRefElement);
        }
        linkRefElement.remove();
        commitAuthoredEdit(vditor, { intent: "linkHtml" });
        hideLinkPopoverOnly(vditor);
        restoreDocumentTargetFocus(vditor, documentTarget, null);
        highlightToolbarWYSIWYG(vditor);
    };

    const view = document.createElement("span");
    view.className = "vditor-link-popover";

    const textInput = document.createElement("input");
    textInput.className = "vditor-link-popover__text vditor-input";
    textInput.setAttribute("placeholder", window.VditorI18n.textIsNotEmpty);
    textInput.value = getDisplayText();
    textInput.oninput = () => {
        updateText();
    };
    textInput.onkeydown = (event) => {
        if (removeBlockElement(vditor, event)) {
            return;
        }
        linkHotkey(vditor, linkRefElement, event, refInput, save, cancel);
    };

    const refInput = document.createElement("input");
    refInput.className = "vditor-link-popover__text vditor-input";
    refInput.setAttribute("placeholder", window.VditorI18n.linkRef);
    refInput.value = linkRefElement.getAttribute("data-link-label") || "";
    refInput.oninput = () => {
        updateRef();
    };
    refInput.onkeydown = (event) => {
        if (removeBlockElement(vditor, event)) {
            return;
        }
        linkHotkey(vditor, linkRefElement, event, textInput, save, cancel);
    };

    function save() { closeLinkPopover(vditor, documentTarget, linkRefElement, () => {
        if (textInput.value.trim() !== "") {
            setDisplayText(textInput.value);
        }
        linkRefElement.setAttribute("data-link-label", refInput.value);
        if (textInput.value !== initialDisplay || refInput.value !== initialReference) {
            commitAuthoredEdit(vditor, { intent: "linkHtml" });
        }
    }); }
    function cancel() { closeLinkPopover(vditor, documentTarget, linkRefElement, () => {
        setDisplayText(initialDisplay);
        linkRefElement.setAttribute("data-link-label", initialReference);
    }); }

    const copy = document.createElement("button");
    copy.setAttribute("type", "button");
    copy.setAttribute("aria-label", window.VditorI18n.copy);
    copy.className = "vditor-link-popover__button vditor-link-popover__button--copy";
    copy.innerHTML = `<span class="vditor-link-popover__button-icon">${codicon("copy")}</span>`;
    copy.onclick = async () => {
        if (await copyRef()) {
            showToast(vditor, window.VditorI18n.linkRefCopied || window.VditorI18n.copied);
        }
    };

    const remove = document.createElement("button");
    remove.setAttribute("type", "button");
    remove.setAttribute("aria-label", window.VditorI18n.remove);
    remove.className = "vditor-link-popover__button vditor-link-popover__button--remove";
    remove.innerHTML = `<span class="vditor-link-popover__button-icon">${codicon("trash")}</span>`;
    remove.onclick = removeLinkRef;

    view.append(textInput, refInput, copy, remove, createLinkPopoverExitHint());
    popover.insertAdjacentElement("beforeend", view);
    bindLinkPopover(vditor, linkRefElement, documentTarget, save, cancel);
    setPopoverPosition(vditor, linkRefElement, "link-ref");
};

const linkHotkey = (
    vditor: IVditor,
    element: HTMLElement,
    event: KeyboardEvent,
    nextInputElement: HTMLInputElement,
    save: () => void,
    cancel: () => void,
) => {
    if (event.isComposing) {
        return;
    }
    if (event.key === "Escape") {
        cancel();
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    if (event.key === "Tab") {
        nextInputElement.focus();
        nextInputElement.select();
        event.preventDefault();
        return;
    }
    if (
        !isCtrl(event) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key === "Enter"
    ) {
        save();
        event.preventDefault();
        return;
    }
    if (
        !isCtrl(event) &&
        !event.shiftKey &&
        event.altKey &&
        event.key === "Enter"
    ) {
        save();
        event.preventDefault();
    }
};

export const genAPopover = (vditor: IVditor, aElement: HTMLElement) => {
    const popover = getModePopover(vditor);
    if (!popover) {
        return;
    }
    const documentTarget = createDocumentTargetForElement(vditor, aElement);
    if (!documentTarget) {
        return;
    }
    (popover as LinkPopoverElement)._sourceElement = aElement;
    popover.innerHTML = "";

    const updateText = () => {
        if (textInput.value.trim() !== "") {
            aElement.innerHTML = textInput.value;
        }
    };

    const updateHref = () => {
        aElement.setAttribute("href", normalizeLinkDestInput(hrefInput.value));
    };

    aElement.querySelectorAll("[data-marker]").forEach((item: HTMLElement) => {
        item.removeAttribute("data-marker");
    });
    const initialText = aElement.innerHTML;
    const initialHref = aElement.getAttribute("href") || "";

    const copyLink = async (): Promise<boolean> => {
        const link = aElement.getAttribute("href") || "";
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(link);
                return true;
            } catch {
                return false;
            }
        }
        const textarea = document.createElement("textarea");
        textarea.value = link;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        return copied;
    };

    const unlinkA = () => {
        const childNodes = Array.from(aElement.childNodes);
        let focusNode: Node = aElement;
        if (childNodes.length > 0) {
            for (const node of childNodes) {
                focusNode = node;
                aElement.parentElement.insertBefore(node, aElement);
            }
        } else {
            focusNode = document.createTextNode(aElement.getAttribute("href") || "");
            aElement.parentElement.insertBefore(focusNode, aElement);
        }
        aElement.remove();
        commitAuthoredEdit(vditor, { intent: "linkHtml" });
        hideLinkPopoverOnly(vditor);
        restoreDocumentTargetFocus(vditor, documentTarget, null);
        highlightToolbarWYSIWYG(vditor);
    };

    const view = document.createElement("span");
    view.className = "vditor-link-popover";

    const textInput = document.createElement("input");
    textInput.className = "vditor-link-popover__text vditor-input";
    textInput.setAttribute("placeholder", window.VditorI18n.textIsNotEmpty);
    textInput.value = aElement.innerHTML || "";
    textInput.oninput = () => {
        updateText();
    };
    textInput.onkeydown = (event) => {
        if (removeBlockElement(vditor, event)) {
            return;
        }
        linkHotkey(vditor, aElement, event, hrefInput, save, cancel);
    };

    const hrefInput = document.createElement("input");
    hrefInput.className = "vditor-link-popover__href vditor-input";
    hrefInput.setAttribute("placeholder", window.VditorI18n.link);
    hrefInput.value = aElement.getAttribute("href") || "";
    hrefInput.oninput = () => {
        updateHref();
    };
    hrefInput.onkeydown = (event) => {
        if (removeBlockElement(vditor, event)) {
            return;
        }
        linkHotkey(vditor, aElement, event, textInput, save, cancel);
    };

    function save() { closeLinkPopover(vditor, documentTarget, aElement, () => {
        if (textInput.value.trim() !== "") {
            updateText();
        }
        updateHref();
        if (aElement.innerHTML !== initialText || aElement.getAttribute("href") !== initialHref) {
            commitAuthoredEdit(vditor, { intent: "linkHtml" });
        }
    }); }
    function cancel() { closeLinkPopover(vditor, documentTarget, aElement, () => {
        aElement.innerHTML = initialText;
        aElement.setAttribute("href", initialHref);
    }); }

    const copy = document.createElement("button");
    copy.setAttribute("type", "button");
    copy.setAttribute("aria-label", window.VditorI18n.copy);
    copy.className = "vditor-link-popover__button vditor-link-popover__button--copy";
    copy.innerHTML = `<span class="vditor-link-popover__button-icon">${codicon("copy")}</span>`;
    copy.onclick = async () => {
        if (await copyLink()) {
            showToast(vditor, window.VditorI18n.linkCopied || window.VditorI18n.copied);
        }
    };

    const remove = document.createElement("button");
    remove.setAttribute("type", "button");
    remove.setAttribute("aria-label", window.VditorI18n.remove);
    remove.className = "vditor-link-popover__button vditor-link-popover__button--remove";
    remove.innerHTML = `<span class="vditor-link-popover__button-icon">${codicon("trash")}</span>`;
    remove.onclick = unlinkA;

    const hint = createLinkPopoverExitHint();

    view.append(textInput, hrefInput, copy, remove, hint);
    popover.insertAdjacentElement("beforeend", view);
    bindLinkPopover(vditor, aElement, documentTarget, save, cancel);
    setPopoverPosition(vditor, aElement, "link");
};

export const genImagePopoverForElement = (vditor: IVditor, imgElement: HTMLImageElement) => {
    const popover = getModePopover(vditor);
    if (!popover) {
        return;
    }
    const documentTarget = createDocumentTargetForElement(vditor, imgElement);
    if (!documentTarget) {
        return;
    }
    (popover as LinkPopoverElement)._sourceElement = imgElement;
    popover.innerHTML = "";

    const initialAlt = imgElement.getAttribute("alt") || "";
    const initialSrc = imgElement.getAttribute("src") || "";

    const updateAlt = () => {
        imgElement.setAttribute("alt", altInput.value);
    };

    const updateSrc = () => {
        imgElement.setAttribute("src", normalizeLinkDestInput(srcInput.value));
    };

    const copySrc = async (): Promise<boolean> => {
        const src = srcInput.value;
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(src);
                return true;
            } catch {
                return false;
            }
        }
        const textarea = document.createElement("textarea");
        textarea.value = src;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        return copied;
    };

    const removeImage = () => {
        imgElement.remove();
        commitAuthoredEdit(vditor, { intent: "linkHtml" });
        hideLinkPopoverOnly(vditor);
        restoreDocumentTargetFocus(vditor, documentTarget, null);
        highlightToolbarWYSIWYG(vditor);
    };

    const view = document.createElement("span");
    view.className = "vditor-link-popover";

    const altInput = document.createElement("input");
    altInput.className = "vditor-link-popover__text vditor-input";
    altInput.setAttribute("placeholder", window.VditorI18n.alternateText);
    altInput.value = imgElement.getAttribute("alt") || "";
    altInput.oninput = () => {
        updateAlt();
    };
    altInput.onkeydown = (elementEvent) => {
        if (removeBlockElement(vditor, elementEvent)) {
            return;
        }
        linkHotkey(vditor, imgElement, elementEvent, srcInput, save, cancel);
    };

    const srcInput = document.createElement("input");
    srcInput.className = "vditor-link-popover__href vditor-input";
    srcInput.setAttribute("placeholder", window.VditorI18n.imageURL);
    srcInput.value = imgElement.getAttribute("src") || "";
    srcInput.oninput = () => {
        updateSrc();
    };
    srcInput.onkeydown = (elementEvent) => {
        if (removeBlockElement(vditor, elementEvent)) {
            return;
        }
        linkHotkey(vditor, imgElement, elementEvent, altInput, save, cancel);
    };

    function save() { closeLinkPopover(vditor, documentTarget, imgElement, () => {
        updateAlt();
        updateSrc();
        if (imgElement.getAttribute("alt") !== initialAlt || imgElement.getAttribute("src") !== initialSrc) {
            commitAuthoredEdit(vditor, { intent: "linkHtml" });
        }
    }); }
    function cancel() { closeLinkPopover(vditor, documentTarget, imgElement, () => {
        imgElement.setAttribute("alt", initialAlt);
        imgElement.setAttribute("src", initialSrc);
    }); }

    const copy = document.createElement("button");
    copy.setAttribute("type", "button");
    copy.setAttribute("aria-label", window.VditorI18n.copy);
    copy.className = "vditor-link-popover__button vditor-link-popover__button--copy";
    copy.innerHTML = `<span class="vditor-link-popover__button-icon">${codicon("copy")}</span>`;
    copy.onclick = async () => {
        if (await copySrc()) {
            showToast(vditor, window.VditorI18n.linkCopied || window.VditorI18n.copied);
        }
    };

    const remove = document.createElement("button");
    remove.setAttribute("type", "button");
    remove.setAttribute("aria-label", window.VditorI18n.remove);
    remove.className = "vditor-link-popover__button vditor-link-popover__button--remove";
    remove.innerHTML = `<span class="vditor-link-popover__button-icon">${codicon("trash")}</span>`;
    remove.onclick = removeImage;

    view.append(altInput, srcInput, copy, remove, createLinkPopoverExitHint());
    popover.insertAdjacentElement("beforeend", view);
    bindLinkPopover(vditor, imgElement, documentTarget, save, cancel);
    setPopoverPosition(vditor, imgElement, "image");
};

export const genImagePopover = (event: Event, vditor: IVditor) => {
    genImagePopoverForElement(vditor, event.target as HTMLImageElement);
};


export const genWikiPopover = (vditor: IVditor, wikiElement: HTMLElement) => {
    const popover = getModePopover(vditor);
    if (!popover) {
        return;
    }
    const documentTarget = createDocumentTargetForElement(vditor, wikiElement);
    if (!documentTarget) {
        return;
    }
    (popover as LinkPopoverElement)._sourceElement = wikiElement;
    popover.innerHTML = "";

    const initialDestination = wikiElement.getAttribute("data-href") || wikiElement.dataset.href || "";
    const hash = initialDestination.indexOf("#");
    const initialPath = hash < 0 ? initialDestination : initialDestination.slice(0, hash);
    const initialFragment = hash < 0 ? "" : initialDestination.slice(hash + 1);
    const displayEl = wikiElement.querySelector<HTMLElement>(".vditor-wikilink__display");
    const sourceEl = wikiElement.querySelector<HTMLElement>(".vditor-wikilink__source")
        || Array.from(wikiElement.children).find((child) =>
            child instanceof HTMLElement && child.getAttribute("data-newline") === "1") as HTMLElement | undefined;
    const initialDisplay = displayEl?.textContent?.trim()
        || (wikiElement.classList.contains("obsidian-wikilink") ? wikiElement.textContent?.trim() : "")
        || initialPath
        || initialDestination;

    const buildDestination = () => {
        const path = pathInput.value.trim();
        const fragment = fragmentInput.value.trim();
        if (!path) {
            return fragment ? `#${fragment}` : "";
        }
        return fragment ? `${path}#${fragment}` : path;
    };

    const buildSource = (destination: string, display: string) => {
        if (!display || display === destination || display === destination.split("#")[0]) {
            return `[[${destination}]]`;
        }
        return `[[${destination}|${display}]]`;
    };

    const applyFields = () => {
        const destination = buildDestination();
        const display = textInput.value.trim() || destination.split("#")[0] || destination;
        wikiElement.setAttribute("data-href", destination);
        if (wikiElement.dataset) {
            wikiElement.dataset.href = destination;
        }
        if (displayEl) {
            displayEl.textContent = display;
        }
        if (sourceEl) {
            sourceEl.textContent = buildSource(destination, display);
        }
    };

    const view = document.createElement("span");
    view.className = "vditor-link-popover";

    const textInput = document.createElement("input");
    textInput.className = "vditor-link-popover__text vditor-input";
    textInput.setAttribute("placeholder", window.VditorI18n.textIsNotEmpty || "Display");
    textInput.value = initialDisplay;

    const pathInput = document.createElement("input");
    pathInput.className = "vditor-link-popover__href vditor-input";
    pathInput.setAttribute("placeholder", "Wiki path");
    pathInput.value = initialPath;

    const fragmentInput = document.createElement("input");
    fragmentInput.className = "vditor-link-popover__href vditor-input";
    fragmentInput.setAttribute("placeholder", "Fragment");
    fragmentInput.value = initialFragment;

    function save() {
        closeLinkPopover(vditor, documentTarget, wikiElement, () => {
            applyFields();
            const nextDestination = wikiElement.getAttribute("data-href") || "";
            const nextDisplay = displayEl?.textContent?.trim() || "";
            if (nextDestination !== initialDestination || nextDisplay !== initialDisplay) {
                commitAuthoredEdit(vditor, { intent: "linkHtml" });
            }
        });
    }
    function cancel() {
        closeLinkPopover(vditor, documentTarget, wikiElement, () => {
            wikiElement.setAttribute("data-href", initialDestination);
            if (wikiElement.dataset) {
                wikiElement.dataset.href = initialDestination;
            }
            if (displayEl) {
                displayEl.textContent = initialDisplay;
            }
            if (sourceEl) {
                sourceEl.textContent = buildSource(initialDestination, initialDisplay);
            }
        });
    }

    for (const input of [textInput, pathInput, fragmentInput]) {
        input.onkeydown = (event) => {
            if (removeBlockElement(vditor, event)) {
                return;
            }
            if (event.key === "Enter") {
                event.preventDefault();
                save();
            } else if (event.key === "Escape") {
                event.preventDefault();
                cancel();
            }
        };
    }

    view.append(textInput, pathInput, fragmentInput, createLinkPopoverExitHint());
    popover.insertAdjacentElement("beforeend", view);
    bindLinkPopover(vditor, wikiElement, documentTarget, save, cancel);
    setPopoverPosition(vditor, wikiElement, "link");
};


const linkRefFromSibling = (node: Node | null): HTMLElement | null =>
    node?.nodeType === 1 && (node as HTMLElement).getAttribute("data-type") === "link-ref"
        ? node as HTMLElement : null;

const anchorFromSibling = (node: Node | null): HTMLElement | null =>
    node?.nodeType === 1 && (node as Element).tagName === "A" ? node as HTMLElement : null;

const createEditableImageMatcher = (vditor: IVditor) => (node: Node | null): HTMLImageElement | null => {
    if (!(node instanceof HTMLImageElement)) {
        return null;
    }
    if (isPlantumlRenderImage(node)) {
        return null;
    }
    if (vditor.currentMode === "wysiwyg" && node.parentElement?.classList.contains("vditor-wysiwyg__preview")) {
        return null;
    }
    return node;
};

const resolveAdjacentLinkRef = (range: Range) =>
    resolveAdjacentElementFromRange(
        range,
        (currentRange) => {
            const inside = hasClosestByAttribute(currentRange.startContainer, "data-type", "link-ref") as HTMLElement | false;
            return inside || null;
        },
        linkRefFromSibling,
    );

const resolveAdjacentAnchor = (range: Range) =>
    resolveAdjacentElementFromRange(
        range,
        (currentRange) => {
            const inside = hasClosestByMatchTag(currentRange.startContainer, "A") as HTMLElement | false;
            return inside || null;
        },
        anchorFromSibling,
    );

const resolveAdjacentEditableImage = (vditor: IVditor, range: Range) => {
    const matcher = createEditableImageMatcher(vditor);
    return resolveAdjacentElementFromRange(
        range,
        (currentRange) => {
            const inside = hasClosestByMatchTag(currentRange.startContainer, "IMG") as HTMLImageElement | false;
            if (!inside) {
                return null;
            }
            return matcher(inside);
        },
        matcher,
    );
};

const focusLinkPopoverInput = (vditor: IVditor) => {
    const inputElement = getModePopover(vditor)?.querySelector("input") as HTMLInputElement | null;
    if (!inputElement) {
        return;
    }
    inputElement.focus();
    inputElement.select();
};

const isLinkPopoverOpen = (vditor: IVditor) => {
    const popover = getModePopover(vditor);
    return popover?.style.display === "block" && popover.classList.contains("vditor-panel--link");
};

export const handleLinkPopoverAltEnter = (vditor: IVditor, range: Range): boolean => {
    if (isLinkPopoverOpen(vditor)) {
        return false;
    }

    const wiki = hasClosestByAttribute(range.startContainer as HTMLElement, "data-type", "wikilink")
        || hasClosestByAttribute(range.startContainer as HTMLElement, "data-type", "wikilink-embed");
    if (wiki) {
        genWikiPopover(vditor, wiki as HTMLElement);
        focusLinkPopoverInput(vditor);
        return true;
    }

    const linkRef = resolveAdjacentLinkRef(range);
    if (linkRef) {
        genLinkRefPopover(vditor, linkRef);
        focusLinkPopoverInput(vditor);
        return true;
    }

    const image = resolveAdjacentEditableImage(vditor, range);
    if (image) {
        genImagePopoverForElement(vditor, image);
        focusLinkPopoverInput(vditor);
        return true;
    }

    const anchor = resolveAdjacentAnchor(range);
    if (anchor) {
        genAPopover(vditor, anchor);
        focusLinkPopoverInput(vditor);
        return true;
    }

    return false;
};


const tryGetElement = (range: Range): HTMLElement => {
    const typeElement = range.startContainer as HTMLElement;

    return hasClosestByTag(typeElement, "BLOCKQUOTE") as HTMLTableElement
        || hasClosestByMatchTag(typeElement, "LI") as HTMLBaseElement
        ||hasClosestByMatchTag(typeElement, "TABLE") as HTMLTableElement
        || hasClosestByClassName(typeElement, "vditor-wysiwyg__block") as HTMLElement
        || hasClosestByHeadings(typeElement) as HTMLElement
        ||  hasClosestByAttribute(typeElement, "data-block", "0") as HTMLElement
        ;
};

const isSkippableEmptyParagraph = (element: HTMLElement | null) => {
    return !!element
        && element.tagName === "P"
        && element.getAttribute("data-block") === "0"
        && element.textContent.trim().replace(Constants.ZWSP, "") === "";
};

const skipEmptyParagraphs = (element: HTMLElement | null, direction: "up" | "down"): HTMLElement | null => {
    let current = element;
    while (current && isSkippableEmptyParagraph(current)) {
        current = (direction === "up"
            ? current.previousElementSibling
            : current.nextElementSibling) as HTMLElement | null;
    }
    return current;
};

const cleanupEmptyList = (list: HTMLElement | null) => {
    if (!list || (list.tagName !== "UL" && list.tagName !== "OL") || list.childElementCount > 0) {
        return;
    }
    const emptyAfter = list.nextElementSibling as HTMLElement | null;
    const emptyBefore = list.previousElementSibling as HTMLElement | null;
    list.remove();
    if (emptyAfter && isSkippableEmptyParagraph(emptyAfter)) {
        emptyAfter.remove();
    }
    if (emptyBefore && isSkippableEmptyParagraph(emptyBefore)) {
        emptyBefore.remove();
    }
};

const moveListItem = (li: HTMLElement, direction: "up" | "down") => {
    const inlineSibling = (direction === "up"
        ? li.previousElementSibling
        : li.nextElementSibling) as HTMLElement | null;
    if (inlineSibling?.tagName === "LI") {
        if (direction === "up") {
            inlineSibling.insertAdjacentElement("beforebegin", li);
        } else {
            inlineSibling.insertAdjacentElement("afterend", li);
        }
        return true;
    }

    const sourceList = li.parentElement as HTMLElement | null;
    if (!sourceList || (sourceList.tagName !== "UL" && sourceList.tagName !== "OL")) {
        return false;
    }

    const adjacentList = skipEmptyParagraphs(
        (direction === "up"
            ? sourceList.previousElementSibling
            : sourceList.nextElementSibling) as HTMLElement | null,
        direction,
    );
    if (!adjacentList || (adjacentList.tagName !== "UL" && adjacentList.tagName !== "OL")) {
        return false;
    }

    if (direction === "up") {
        adjacentList.appendChild(li);
    } else {
        adjacentList.insertBefore(li, adjacentList.firstChild);
    }
    cleanupEmptyList(sourceList);
    return true;
};

const moveBlockSibling = (element: HTMLElement, direction: "up" | "down", editorElement: HTMLElement) => {
    let sibling = (direction === "up"
        ? element.previousElementSibling
        : element.nextElementSibling) as HTMLElement | null;
    sibling = skipEmptyParagraphs(sibling, direction);
    if (!sibling) {
        return false;
    }
    if (!element.parentElement?.isEqualNode(editorElement) && element.tagName !== "LI") {
        return false;
    }
    if (direction === "up") {
        sibling.insertAdjacentElement("beforebegin", element);
    } else {
        sibling.insertAdjacentElement("afterend", element);
    }
    return true;
};

const performBlockMove = (range: Range, vditor: IVditor, direction: "up" | "down") => {
    const element = tryGetElement(range);
    if (!element) {
        return;
    }
    const wbr = document.createElement("wbr");
    range.insertNode(wbr);
    const moved = element.tagName === "LI"
        ? moveListItem(element, direction)
        : moveBlockSibling(element, direction, vditor.wysiwyg.element);
    if (!moved) {
        wbr.remove();
        return;
    }
    setRangeByWbr(vditor.wysiwyg.element, range);
    afterRenderEvent(vditor);
    highlightToolbarWYSIWYG(vditor);
};

export function moveDown(range: Range, vditor: IVditor) {
    performBlockMove(range, vditor, "down");
}

export function moveUp(range: Range, vditor: IVditor) {
    performBlockMove(range, vditor, "up");
}
