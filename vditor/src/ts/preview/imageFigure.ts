const IMAGE_FIGURE_ATTR = "data-vditor-image-figure";
const IMAGE_POLISHED_CLASS = "vditor-image-polished";

export const getImageCaption = (img: HTMLImageElement): string =>
    img.getAttribute("title")?.trim() || img.getAttribute("alt")?.trim() || "";

export const enhanceImagePresentation = (img: HTMLImageElement) => {
    if (img.closest(`figure[${IMAGE_FIGURE_ATTR}]`)) {
        return;
    }
    const parent = img.parentElement;
    if (!parent || parent.tagName === "A") {
        img.classList.add(IMAGE_POLISHED_CLASS);
        return;
    }

    const figure = document.createElement("figure");
    figure.className = "vditor-image-figure";
    figure.setAttribute(IMAGE_FIGURE_ATTR, "true");
    parent.insertBefore(figure, img);
    figure.appendChild(img);

    const captionText = getImageCaption(img);
    if (captionText) {
        const caption = document.createElement("figcaption");
        caption.className = "vditor-image-figure__caption";
        caption.textContent = captionText;
        figure.appendChild(caption);
    }
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
