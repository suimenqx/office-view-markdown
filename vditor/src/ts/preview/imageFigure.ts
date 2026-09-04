const IMAGE_FIGURE_ATTR = "data-vditor-image-figure";
const IMAGE_POLISHED_CLASS = "vditor-image-polished";

/**
 * Caption is warranted when title is set, or when alt looks like intentional prose
 * (not empty, not a bare filename/extension, not a generic decorative token).
 */
export const imageCaptionIsWarranted = (img: HTMLImageElement): boolean => {
    const title = img.getAttribute("title")?.trim() || "";
    if (title) {
        return true;
    }
    const alt = img.getAttribute("alt")?.trim() || "";
    if (!alt || alt.length < 3) {
        return false;
    }
    if (/^(image|img|photo|picture|icon|logo)(\.\w+)?$/i.test(alt)) {
        return false;
    }
    if (/\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(alt)) {
        return false;
    }
    const src = img.getAttribute("src") || "";
    const base = src.split(/[\\/]/).pop()?.split("?")[0] || "";
    if (base && (alt === base || alt === base.replace(/\.[^.]+$/, ""))) {
        return false;
    }
    return true;
};

export const getImageCaption = (img: HTMLImageElement): string => {
    if (!imageCaptionIsWarranted(img)) {
        return "";
    }
    return img.getAttribute("title")?.trim() || img.getAttribute("alt")?.trim() || "";
};

export const enhanceImagePresentation = (img: HTMLImageElement) => {
    if (img.closest(`figure[${IMAGE_FIGURE_ATTR}]`)) {
        return;
    }
    // Always apply light radius/border/shadow polish without requiring a figure.
    img.classList.add(IMAGE_POLISHED_CLASS);

    const captionText = getImageCaption(img);
    if (!captionText) {
        return;
    }

    const parent = img.parentElement;
    if (!parent || parent.tagName === "A") {
        return;
    }
    // Do not inject <figure> inside <p> — browsers split the paragraph and break WYSIWYG.
    if (parent.tagName === "P") {
        return;
    }

    const figure = document.createElement("figure");
    figure.className = "vditor-image-figure";
    figure.setAttribute(IMAGE_FIGURE_ATTR, "true");
    parent.insertBefore(figure, img);
    figure.appendChild(img);

    const caption = document.createElement("figcaption");
    caption.className = "vditor-image-figure__caption";
    caption.textContent = captionText;
    figure.appendChild(caption);
};

/** Restore a plain image in the Markdown export clone. */
export const stripImagePresentationFromClone = (root: ParentNode) => {
    root.querySelectorAll(`figure[${IMAGE_FIGURE_ATTR}]`).forEach((figure) => {
        const img = figure.querySelector("img");
        if (img) {
            figure.replaceWith(img);
        } else {
            figure.remove();
        }
    });
    root.querySelectorAll(`img.${IMAGE_POLISHED_CLASS}`).forEach((img) => {
        img.classList.remove(IMAGE_POLISHED_CLASS);
    });
};
