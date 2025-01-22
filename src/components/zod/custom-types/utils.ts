import {z} from 'zod';

import type {StringId} from '../../../db/types/id';
import {decodeId} from '../../../utils/ids';

export const makeIdDecoder = (ctx: z.RefinementCtx) => (val: string) => {
    try {
        return decodeId(val as StringId);
    } catch (err) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `id '${val}' has incorrect format`,
        });
        return z.NEVER;
    }
};
