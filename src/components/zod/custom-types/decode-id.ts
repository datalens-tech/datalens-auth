import {z} from 'zod';

import {makeIdDecoder} from './utils';

export const decodeId = () => {
    return z.string().transform((val, ctx) => {
        return makeIdDecoder(ctx)(val);
    });
};
