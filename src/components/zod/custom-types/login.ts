import {z} from 'zod';

import {LOGIN_REGEX, LOGIN_REGEX_ERROR_MESSAGE} from '../../validation/regexp';

export const login = () =>
    z.string().superRefine((val, ctx) => {
        if (val.length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'should be >= 3',
            });
        }

        if (val.length > 200) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'should be <= 200',
            });
        }

        if (val.includes('@')) {
            try {
                z.string().email().parse(val);
            } catch (err) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Invalid email',
                    fatal: true,
                });
                return z.NEVER;
            }
        } else if (!LOGIN_REGEX.test(val)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: LOGIN_REGEX_ERROR_MESSAGE,
                fatal: true,
            });
            return z.NEVER;
        }
    });
