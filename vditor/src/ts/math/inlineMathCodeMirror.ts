import { EditorView, keymap } from "@codemirror/view";
import { Compartment } from "@codemirror/state";
import { latex } from "codemirror-lang-latex";

import { stopHandledCodeMirrorKeymap, vditorCodeMirrorSetup } from "../codeBlock/codeMirrorSetup";
import { Constants } from "../constants";
import { mathRender } from "../markdown/mathRender";
import { setSelectionFocus } from "../util/selection";

type InlineMathBinding = {
    view: EditorView;
    containerEl: HTMLElement;
    host: HTMLElement;
    codeEl: HTMLElement;
    previewMathEl: HTMLElement;
    languageCompartment: Compartment;
    updating: boolean;
    previewTimer: number;
    vditor: IVditor;
};

const bindings = new WeakMap<HTMLElement, InlineMathBinding>();

const INLINE_MATH_CM_SELECTOR = ".vditor-math-inline--editing .cm-editor";

const resolveInlineMathContainer = (node: HTMLElement): HTMLElement | null => {
    if (node.getAttribute("data-type") === "math-inline") {
        return node;
    }
    const direct = node.closest("[data-type='math-inline']") as HTMLElement | null;
    if (direct) {
        return direct;
    }
    const wysiwyg = node.closest(".vditor-wysiwyg__block[data-type='math-inline']") as HTMLElement | null;
    if (wysiwyg) {
        return wysiwyg;
    }
    const code = node.closest("code[data-type='math-inline']") as HTMLElement | null;
    if (code?.parentElement) {
        return code.parentElement as HTMLElement;
    }
    return null;
};

const getInlineMathParts = (containerEl: HTMLElement) => {
    const host = containerEl.querySelector(".vditor-math-inline__cm-host") as HTMLElement | null;
    const codeEl = containerEl.querySelector("code[data-type='math-inline']") as HTMLElement | null;
    const previewMathEl = containerEl.querySelector(
        ".vditor-wysiwyg__preview .language-math, .vditor-ir__preview .language-math",
    ) as HTMLElement | null;
    if (!host || !codeEl || !previewMathEl) {
        return null;
    }
    return { host, codeEl, previewMathEl };
};

const getCodeText = (codeEl: HTMLElement) => (codeEl.textContent || "").replaceAll(Constants.ZWSP, "");

const getModeEditor = (vditor: IVditor) => {
    if (vditor.currentMode === "wysiwyg") {
        return vditor.wysiwyg.element;
    }
    if (vditor.currentMode === "ir") {
        return vditor.ir.element;
    }
    return null;
};

const focusInlineMathView = (view: EditorView) => {
    view.contentDOM.focus({ preventScroll: true });
};

/** 文本节点是否为纯 ZWSP（lute 在 math-inline 后会插入） */
const isZwspOnlyText = (node: Node | null | undefined): node is Text => {
    return !!node && node.nodeType === 3 && (node.textContent ?? "") === Constants.ZWSP;
};

const moveCaretOutsideInlineMath = (
    vditor: IVditor,
    containerEl: HTMLElement,
    direction: "before" | "after",
) => {
    const editor = getModeEditor(vditor);
    if (editor) {
        editor.focus({ preventScroll: true });
    }

    const range = containerEl.ownerDocument.createRange();
    const parent = containerEl.parentNode;
    const siblings = parent ? Array.from(parent.childNodes) : [];
    const idx = siblings.length ? siblings.indexOf(containerEl) : -1;

    if (direction === "before") {
        const prev = idx > 0 ? siblings[idx - 1] : null;
        if (isZwspOnlyText(prev)) {
            // 公式前 ZWSP：光标放在 ZWSP 之后（offset 1），与行内删除逻辑一致
            range.setStart(prev, 1);
        } else if (prev?.nodeType === 3) {
            range.setStart(prev, prev.textContent?.length ?? 0);
        } else if (parent) {
            const zwsp = document.createTextNode(Constants.ZWSP);
            parent.insertBefore(zwsp, containerEl);
            range.setStart(zwsp, 1);
        } else {
            range.setStartBefore(containerEl);
        }
    } else {
        // lute 在 math-inline 后写入 ZWSP；光标若落在 ZWSP 开头，输入会跳到行首
        let next = idx > -1 ? siblings[idx + 1] : null;
        if (!isZwspOnlyText(next) && parent) {
            const zwsp = document.createTextNode(Constants.ZWSP);
            if (containerEl.nextSibling) {
                parent.insertBefore(zwsp, containerEl.nextSibling);
            } else {
                parent.appendChild(zwsp);
            }
            next = zwsp;
        }
        if (isZwspOnlyText(next)) {
            // 放在 ZWSP 字符之后（offset=1），不要停在 offset=0
            range.setStart(next, 1);
        } else if (next?.nodeType === 3) {
            const text = next.textContent ?? "";
            if (text.startsWith(Constants.ZWSP)) {
                range.setStart(next, 1);
            } else {
                range.setStart(next, 0);
            }
        } else {
            range.setStartAfter(containerEl);
        }
    }
    range.collapse(true);
    setSelectionFocus(range);
    vditor[vditor.currentMode].range = range;
};

/**
 * 若光标在 math-inline 后的纯 ZWSP 开头，挪到该 ZWSP 字符之后。
 * 落在 ZWSP 内 offset=0 时，浏览器输入会异常跳到行首。
 */
export const skipZwspAfterInlineMath = (range: Range, vditor?: IVditor) => {
    const node = range.startContainer;
    if (node.nodeType !== 3 || range.startOffset !== 0) {
        return false;
    }
    if ((node.textContent ?? "") !== Constants.ZWSP) {
        return false;
    }
    const prev = node.previousSibling;
    if (!(prev instanceof HTMLElement) || prev.getAttribute("data-type") !== "math-inline") {
        return false;
    }
    range.setStart(node, 1);
    range.collapse(true);
    setSelectionFocus(range);
    if (vditor) {
        vditor[vditor.currentMode].range = range;
    }
    return true;
};

const updatePreview = (vditor: IVditor, previewMathEl: HTMLElement, latexText: string) => {
    previewMathEl.removeAttribute("data-math");
    previewMathEl.textContent = latexText;
    mathRender(previewMathEl.parentElement as HTMLElement, {
        cdn: vditor.options.cdn,
        math: vditor.options.preview.math,
    });
};

const syncCodeFromView = (binding: InlineMathBinding) => {
    binding.codeEl.textContent = Constants.ZWSP + binding.view.state.doc.toString();
};

const schedulePreviewUpdate = (vditor: IVditor, binding: InlineMathBinding) => {
    window.clearTimeout(binding.previewTimer);
    binding.previewTimer = window.setTimeout(() => {
        if (!bindings.has(binding.containerEl)) {
            return;
        }
        updatePreview(vditor, binding.previewMathEl, binding.view.state.doc.toString());
    }, 200);
};

const inlineMathDomEventHandlers = (
    containerEl: HTMLElement,
    binding: InlineMathBinding,
) => ({
    mousedown: (event: Event) => {
        event.stopPropagation();
    },
    click: (event: Event) => {
        event.stopPropagation();
    },
    focus: () => false,
    blur: () => {
        window.setTimeout(() => {
            if (!bindings.has(containerEl) || binding.view.hasFocus) {
                return;
            }
            if (containerEl.contains(document.activeElement)) {
                return;
            }
            exitInlineMathEdit(containerEl);
            const editor = getModeEditor(binding.vditor);
            const active = document.activeElement;
            if (editor && active && (active === editor || editor.contains(active))) {
                const sel = getSelection();
                if (sel?.rangeCount && editor.contains(sel.getRangeAt(0).startContainer)) {
                    // 点击落在公式后的纯 ZWSP 上时，挪到 ZWSP 之后
                    skipZwspAfterInlineMath(sel.getRangeAt(0), binding.vditor);
                    return;
                }
            }
            moveCaretOutsideInlineMath(binding.vditor, containerEl, "after");
        }, 0);
        return false;
    },
    keydown: (event: Event) => {
        if ((event as KeyboardEvent).defaultPrevented) {
            event.stopPropagation();
        }
    },
    input: (event: Event) => {
        event.stopPropagation();
    },
});

export const isInsideInlineMathCodeMirror = (target: EventTarget | Node | null) => {
    if (!target) {
        return !!document.activeElement?.closest(INLINE_MATH_CM_SELECTOR);
    }
    const node = target instanceof Element ? target : (target as Node).parentElement;
    return !!node?.closest(INLINE_MATH_CM_SELECTOR);
};

export const flushInlineMathToSyncCode = (root: ParentNode) => {
    const containers = root.querySelectorAll(".vditor-math-inline--editing");
    for (let i = 0; i < containers.length; i++) {
        const binding = bindings.get(containers[i] as HTMLElement);
        if (binding) {
            syncCodeFromView(binding);
        }
    }
};

/** Spin 前卸载 inline math CodeMirror，避免 cm-editor DOM 混入 Spin 输入 */
export const deactivateInlineMathEditorsInScope = (scope: ParentNode) => {
    const containers = scope.querySelectorAll(".vditor-math-inline--editing");
    for (let i = 0; i < containers.length; i++) {
        exitInlineMathEdit(containers[i] as HTMLElement);
    }
};

export const enterInlineMathEdit = (vditor: IVditor, fromEl: HTMLElement, focusAtStart = true) => {
    const containerEl = resolveInlineMathContainer(fromEl);
    if (!containerEl) {
        return false;
    }
    const parts = getInlineMathParts(containerEl);
    if (!parts) {
        return false;
    }
    const { host, codeEl, previewMathEl } = parts;

    // Strip any stale inline styles left by other editor code paths.
    host.removeAttribute("style");
    containerEl.removeAttribute("style");

    containerEl.setAttribute("contenteditable", "false");
    host.setAttribute("contenteditable", "false");
    host.classList.add("vditor-math-cm-host");

    containerEl.classList.add("vditor-math-inline--editing");

    const existing = bindings.get(containerEl);
    if (existing?.view.dom.isConnected) {
        existing.vditor = vditor;
        focusInlineMathView(existing.view);
        const pos = focusAtStart ? 0 : existing.view.state.doc.length;
        existing.view.dispatch({ selection: { anchor: pos, head: pos }, scrollIntoView: false });
        return true;
    }
    if (existing) {
        bindings.delete(containerEl);
    }

    host.querySelectorAll(".cm-editor").forEach((editor) => editor.remove());

    const languageCompartment = new Compartment();
    const binding: InlineMathBinding = {
        view: null as unknown as EditorView,
        containerEl,
        host,
        codeEl,
        previewMathEl,
        languageCompartment,
        updating: false,
        previewTimer: 0,
        vditor,
    };

    const latexSupport = latex({ enableAutocomplete: true, enableLinting: false });

    const view = new EditorView({
        doc: getCodeText(codeEl),
        parent: host,
        extensions: [
            vditorCodeMirrorSetup,
            keymap.of(stopHandledCodeMirrorKeymap([
                {
                    key: "ArrowLeft",
                    run: () => {
                        const head = view.state.selection.main.head;
                        if (head !== 0) {
                            return false;
                        }
                        exitInlineMathEdit(containerEl);
                        moveCaretOutsideInlineMath(vditor, containerEl, "before");
                        return true;
                    },
                },
                {
                    key: "ArrowRight",
                    run: () => {
                        const head = view.state.selection.main.head;
                        if (head !== view.state.doc.length) {
                            return false;
                        }
                        exitInlineMathEdit(containerEl);
                        moveCaretOutsideInlineMath(vditor, containerEl, "after");
                        return true;
                    },
                },
                {
                    key: "ArrowUp",
                    run: () => {
                        exitInlineMathEdit(containerEl);
                        moveCaretOutsideInlineMath(vditor, containerEl, "before");
                        return true;
                    },
                },
                {
                    key: "ArrowDown",
                    run: () => {
                        exitInlineMathEdit(containerEl);
                        moveCaretOutsideInlineMath(vditor, containerEl, "after");
                        return true;
                    },
                },
                {
                    key: "Escape",
                    run: () => {
                        exitInlineMathEdit(containerEl);
                        moveCaretOutsideInlineMath(vditor, containerEl, "after");
                        return true;
                    },
                },
            ])),
            languageCompartment.of(latexSupport),
            EditorView.domEventHandlers(inlineMathDomEventHandlers(containerEl, binding)),
            EditorView.updateListener.of((update) => {
                if (binding.updating || !update.docChanged) {
                    return;
                }
                binding.updating = true;
                syncCodeFromView(binding);
                schedulePreviewUpdate(vditor, binding);
                binding.updating = false;
            }),
        ],
    });

    binding.view = view;
    bindings.set(containerEl, binding);

    focusInlineMathView(view);
    const pos = focusAtStart ? 0 : view.state.doc.length;
    view.dispatch({ selection: { anchor: pos, head: pos }, scrollIntoView: false });
    return true;
};

export const exitInlineMathEdit = (containerEl: HTMLElement) => {
    const binding = bindings.get(containerEl);
    if (!binding) {
        containerEl.classList.remove("vditor-math-inline--editing");
        containerEl.removeAttribute("contenteditable");
        return;
    }
    window.clearTimeout(binding.previewTimer);
    syncCodeFromView(binding);
    binding.view.destroy();
    bindings.delete(containerEl);
    binding.host.querySelector(".cm-editor")?.remove();
    containerEl.classList.remove("vditor-math-inline--editing");
    containerEl.removeAttribute("contenteditable");
};
