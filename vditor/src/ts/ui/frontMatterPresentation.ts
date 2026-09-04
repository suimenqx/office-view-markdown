export const FRONT_MATTER_PRESENTATIONS = ["table", "chips"] as const;

export type FrontMatterPresentation = typeof FRONT_MATTER_PRESENTATIONS[number];

export const resolveFrontMatterPresentation = (value: unknown): FrontMatterPresentation =>
    value === "chips" ? "chips" : "table";

export const isShortFrontMatterProperty = (key: string, value: string): boolean =>
    key.length <= 32 && value.trim().length <= 96;

export const applyFrontMatterPresentation = (
    root: ParentNode,
    presentation: FrontMatterPresentation,
) => {
    root.querySelectorAll<HTMLElement>("[data-type='yaml-front-matter']").forEach((block) => {
        const isChips = presentation === "chips";
        block.classList.toggle("vditor-front-matter--chips", isChips);
        block.querySelectorAll<HTMLElement>(".vditor-properties__row").forEach((row) => {
            const key = row.getAttribute("data-key") || "";
            const value = row.querySelector(".vditor-properties__value")?.textContent || "";
            row.classList.toggle(
                "vditor-properties__row--chip",
                isChips && isShortFrontMatterProperty(key, value),
            );
        });
    });
};
