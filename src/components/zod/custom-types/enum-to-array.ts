import {z} from 'zod';

type EnumLike = Readonly<Record<string, string | number>>;

export const enumToArray = <T extends EnumLike>({
    value,
    min = 1,
    max = Infinity,
}: {
    value: T;
    min?: number;
    max?: number;
}) =>
    z
        .enum(value)
        .or(z.enum(value).array())
        .transform((val) => (Array.isArray(val) ? val : [val]))
        .pipe(z.enum(value).array().min(min).max(max));
