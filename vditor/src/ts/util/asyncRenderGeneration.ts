/**
 * ADR 0013 — async diagram/image render generation guards.
 * Commit SVG/img/error chrome only when (block identity, source revision,
 * theme/config) is still current and the host is connected.
 * Presentation/lifecycle only: does not invent undo (ADR 0009) or steal focus (ADR 0010).
 */

export type AsyncRenderTuple = {
    blockIdentity: string;
    sourceRevision: string;
    themeConfig: string;
};

export type AsyncRenderGeneration = AsyncRenderTuple & {
    generationId: number;
};

export const ASYNC_RENDER_BLOCK_ID_ATTR = "data-async-render-id";

type BlockGenerationState = {
    current: AsyncRenderGeneration;
};

const blockState = new Map<string, BlockGenerationState>();
let nextGenerationId = 1;
let nextBlockSerial = 1;

/** Test/reset helper — not used in product paths. */
export const resetAsyncRenderGenerationsForTests = () => {
    blockState.clear();
    nextGenerationId = 1;
    nextBlockSerial = 1;
};

export const fingerprintSourceRevision = (source: string): string => source;

export const fingerprintThemeConfig = (...parts: Array<string | null | undefined>): string =>
    parts.map((p) => (p == null ? "" : String(p))).join("\u0001");

export const ensureAsyncRenderBlockIdentity = (host: Element): string => {
    let id = host.getAttribute(ASYNC_RENDER_BLOCK_ID_ATTR);
    if (!id) {
        id = `arg-${nextBlockSerial++}`;
        host.setAttribute(ASYNC_RENDER_BLOCK_ID_ATTR, id);
    }
    return id;
};

export const beginAsyncRenderGeneration = (
    host: Element,
    source: string,
    themeConfig: string,
): AsyncRenderGeneration => {
    const blockIdentity = ensureAsyncRenderBlockIdentity(host);
    const generation: AsyncRenderGeneration = {
        blockIdentity,
        sourceRevision: fingerprintSourceRevision(source),
        themeConfig,
        generationId: nextGenerationId++,
    };
    blockState.set(blockIdentity, { current: generation });
    return generation;
};

export const getCurrentAsyncRenderGeneration = (
    blockIdentity: string,
): AsyncRenderGeneration | undefined => {
    return blockState.get(blockIdentity)?.current;
};

export const supersedeAsyncRenderBlock = (blockIdentity: string): void => {
    blockState.delete(blockIdentity);
};

/** Invalidate every in-flight generation whose themeConfig matches (exact). */
export const invalidateAsyncRenderThemeConfig = (themeConfig: string): void => {
    for (const [id, state] of blockState) {
        if (state.current.themeConfig === themeConfig) {
            blockState.delete(id);
        }
    }
};

/** Invalidate all known generations (e.g. broad theme remount). */
export const invalidateAllAsyncRenderGenerations = (): void => {
    blockState.clear();
};

export const isAsyncRenderHostConnected = (host: Element | null | undefined): boolean => {
    if (!host) {
        return false;
    }
    // Prefer DOM isConnected; allow explicit stub property in unit tests.
    const connected = (host as HTMLElement).isConnected;
    if (typeof connected === "boolean") {
        return connected;
    }
    return true;
};

export const isAsyncRenderGenerationCurrent = (
    generation: AsyncRenderGeneration,
): boolean => {
    const current = blockState.get(generation.blockIdentity)?.current;
    if (!current) {
        return false;
    }
    return (
        current.generationId === generation.generationId
        && current.blockIdentity === generation.blockIdentity
        && current.sourceRevision === generation.sourceRevision
        && current.themeConfig === generation.themeConfig
    );
};

/**
 * Gate for writing SVG / img / AES chrome.
 * True only when the generation tuple is still current and the host is connected.
 */
export const canCommitAsyncRender = (
    generation: AsyncRenderGeneration,
    host: Element | null | undefined,
): boolean => {
    return isAsyncRenderHostConnected(host) && isAsyncRenderGenerationCurrent(generation);
};

/**
 * Helper for Retry: compare a closed-over snapshot to what the host currently holds.
 * Product Retry must re-read current source rather than reuse the snapshot.
 */
export const shouldRereadSourceForRetry = (
    closedOverSource: string,
    currentSource: string,
): boolean => {
    return fingerprintSourceRevision(closedOverSource) !== fingerprintSourceRevision(currentSource);
};
