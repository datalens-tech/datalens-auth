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

export type EnumToStringUnion<T> = `${T & string}`;
