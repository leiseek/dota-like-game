const UINT32_MAX_EXCLUSIVE = 0x100000000;
export function normalizeSeed(seed) {
    return seed >>> 0;
}
export function nextRandom(state) {
    const nextState = (Math.imul(1664525, state >>> 0) + 1013904223) >>> 0;
    return {
        value: nextState / UINT32_MAX_EXCLUSIVE,
        state: nextState,
    };
}
