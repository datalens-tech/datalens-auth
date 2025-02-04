import {z} from 'zod';

import {macrotasksMap} from '../../../utils/ids';

import {makeIdDecoder} from './utils';

export const decodeIdArray = ({min = 1, max = Infinity}: {min?: number; max?: number}) => {
    return z
        .string()
        .array()
        .min(min)
        .max(max)
        .transform(async (val, ctx) => {
            return await macrotasksMap(val, makeIdDecoder(ctx));
        });
};
