/**
 * Pure primary-toolbar composition for office-view-markdown.markdownViewer (ADR 0016).
 * Visible primary controls exclude `|` dividers; submenu items under `more` do not count.
 *
 * Right-anchored items use `className: 'right'` (float:right). Because float:right packs
 * first-declared furthest right, declare them in reverse of the desired L→R visual order:
 * settings → theme → edit-in-vscode → save  ⇒  visual save / edit / theme / settings.
 */

export const PRIMARY_TOOLBAR_MAX_VISIBLE = 14;

export const MORE_TOOLBAR_ITEMS = [
    'headings',
    'strike',
    'ordered-list',
    'check',
    'quote',
    'code',
    'inline-code',
    'upload',
    'editor-theme-toggle',
];

/** Build the primary toolbar spec (strings + objects). `onSave` wires the save button. */
export function composePrimaryToolbar(onSave = null, codicon = (name) => name) {
    const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac OS');
    const shortcutTip = isMac ? '⌘ ^ E' : 'Ctrl Alt E';
    const icon = (name) => (typeof codicon === 'function' ? codicon(name) : codicon);

    return [
        'outline',
        'bold',
        'italic',
        'link',
        '|',
        'list',
        'table',
        '|',
        'undo',
        'redo',
        'find',
        {
            name: 'more',
            toolbar: [...MORE_TOOLBAR_ITEMS],
        },
        // right cluster — reverse DOM for float:right packing
        {
            name: 'settings',
            className: 'right',
        },
        {
            name: 'editor-theme',
            className: 'right',
        },
        {
            name: 'edit-in-vscode',
            tip: `Edit In VSCode (${shortcutTip})`,
            className: 'right',
            icon: icon('vscode'),
            click() {
                if (typeof handler !== 'undefined') {
                    handler.emit('editInVSCode', true);
                }
            },
        },
        {
            name: 'save',
            tip: 'Save',
            className: 'right',
            icon: icon('save'),
            click() {
                onSave?.();
            },
        },
    ];
}

/** Visible primary control names (no dividers). */
export function listPrimaryVisibleNames(toolbar = composePrimaryToolbar()) {
    return toolbar
        .map((item) => (typeof item === 'string' ? item : item?.name))
        .filter((name) => name && name !== '|');
}

export function countPrimaryVisible(toolbar = composePrimaryToolbar()) {
    return listPrimaryVisibleNames(toolbar).length;
}

export function primaryHasUpload(toolbar = composePrimaryToolbar()) {
    return listPrimaryVisibleNames(toolbar).includes('upload');
}

export function primaryThemeEntries(toolbar = composePrimaryToolbar()) {
    return listPrimaryVisibleNames(toolbar).filter(
        (name) => name === 'editor-theme' || name === 'editor-theme-toggle',
    );
}

export function moreContainsUpload(toolbar = composePrimaryToolbar()) {
    const more = toolbar.find((item) => typeof item === 'object' && item?.name === 'more');
    const sub = more?.toolbar || [];
    return sub.some((item) => (typeof item === 'string' ? item : item?.name) === 'upload');
}

export function listRightAnchoredNames(toolbar = composePrimaryToolbar()) {
    return toolbar
        .filter((item) => typeof item === 'object' && item?.className?.split(/\s+/).includes('right'))
        .map((item) => item.name);
}
