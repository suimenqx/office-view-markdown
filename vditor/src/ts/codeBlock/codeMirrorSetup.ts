import {
    highlightSpecialChars,
    drawSelection,
    dropCursor,
    rectangularSelection,
    crosshairCursor,
    highlightActiveLine,
    keymap,
    type KeyBinding,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { indentOnInput, bracketMatching } from "@codemirror/language";
import { history, defaultKeymap, historyKeymap } from "@codemirror/commands";
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { vditorSyntaxHighlighting } from "./codeMirrorHighlight";

export const stopHandledCodeMirrorKeymap = (bindings: readonly KeyBinding[]) =>
    bindings.map((binding) => ({
        ...binding,
        stopPropagation: true,
    }));

/** Document-level undo/redo keys — owned by ADR 0009 outer stack, not CM. */
const DOCUMENT_HISTORY_KEYS = new Set([
    "Mod-z",
    "Mod-Z",
    "Mod-y",
    "Mod-Y",
    "Mod-Shift-z",
    "Mod-Shift-Z",
]);

const isDocumentHistoryBinding = (binding: KeyBinding) => {
    const keys = [binding.key, binding.mac, binding.win, binding.linux]
        .filter(Boolean)
        .map((k) => String(k));
    return keys.some((k) => DOCUMENT_HISTORY_KEYS.has(k));
};

/** Keep CM history() for ephemeral intra-block soft-undo only; do not steal Ctrl/Cmd+Z. */
export const vditorLocalHistoryKeymap = historyKeymap.filter((binding) => !isDocumentHistoryBinding(binding));

/** basicSetup without defaultHighlightStyle — layout in _codemirror.less, colors via CSS variables / theme files */
export const vditorCodeMirrorSetup = [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    EditorState.tabSize.of(4),
    indentOnInput(),
    vditorSyntaxHighlighting,
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    keymap.of(stopHandledCodeMirrorKeymap([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...vditorLocalHistoryKeymap,
        ...completionKeymap,
    ])),
];
