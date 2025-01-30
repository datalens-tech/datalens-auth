type ObjectKeys<T extends object> = `${Exclude<keyof T, symbol>}`;

export const objectKeys = Object.keys as <T extends object>(value: T) => Array<ObjectKeys<T>>;

export type Nullable<T> = T | null;

export type NullableValues<T> = {
    [P in keyof T]: T[P] | null;
};

export type Optional<T> = T | undefined;

export type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type ValueOf<T> = T[keyof T];

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never;

/**
 * PickAndRenameKeys
 * @desc From `T` pick a set of properties and replace keys by key map `R`
 * @example
 *   type Props = {name: string; age: number; visible: boolean};
 *   type KeyMap = {name: 'surname'; age: 'distance'};
 *
 *   // Expect: {surname: string; distance: number};
 *   type NewProps = PickAndRenameKeys<Props, KeyMap>;
 */
export type PickAndRenameKeys<
    T,
    R extends {[K in keyof R]: K extends keyof T ? PropertyKey : never},
> = UnionToIntersection<{[P in keyof R & keyof T]: {[PP in R[P]]: T[P]}}[keyof R & keyof T]>;

type UnionToParm<U> = U extends any ? (k: U) => void : never;
type UnionToSect<U> = UnionToParm<U> extends (k: infer I) => void ? I : never;
type ExtractParm<F> = F extends {(a: infer A): void} ? A : never;
type SpliceOne<Union> = Exclude<Union, ExtractOne<Union>>;
type ExtractOne<Union> = ExtractParm<UnionToSect<UnionToParm<Union>>>;
type UnionToTuple<Union> = UnionToTupleRec<Union, []>;
type UnionToTupleRec<Union, Rslt extends any[]> =
    SpliceOne<Union> extends never
        ? [ExtractOne<Union>, ...Rslt]
        : UnionToTupleRec<SpliceOne<Union>, [ExtractOne<Union>, ...Rslt]>;

export type EnumToUnion<V extends string | number> = `${V}` extends `${infer T extends string}`
    ? T
    : never;

export const enumToTuple = Object.values as <E extends string | number, K extends string>(enumDef: {
    [key in K]: E;
}) => UnionToTuple<EnumToUnion<E>>;
