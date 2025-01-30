import {EnumLike, z} from 'zod';

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
        .nativeEnum(value)
        .or(z.nativeEnum(value).array())
        .transform((val) => (Array.isArray(val) ? val : [val]))
        .pipe(z.nativeEnum(value).array().min(min).max(max));
