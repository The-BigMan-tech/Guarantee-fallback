export type Tuple<T, N extends number, R extends unknown[] = []> = 
    R['length'] extends N ? R : Tuple<T, N, [...R, T]>;

export type TupleLength<T extends readonly any[]> = T['length'];

//this only works for non-negative integer unions up to 999.its capped because of recursion
export type Max<N extends number, A extends any[] = []> =
    [N] extends [Partial<A>['length']] ? A['length'] : Max<N, [0, ...A]>;

export type AddUnionToElements<T extends readonly any[], U> = {
    [K in keyof T]: T[K] | U;
};