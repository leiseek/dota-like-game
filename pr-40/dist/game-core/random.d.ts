export type RandomResult = Readonly<{
    value: number;
    state: number;
}>;
export declare function normalizeSeed(seed: number): number;
export declare function nextRandom(state: number): RandomResult;
