import {z} from 'zod';

import {LOGIN_REGEX, LOGIN_REGEX_ERROR_MESSAGE} from '../../validation/regexp';

const min = 3;
const max = 200;

export const login = () =>
    z.string().superRefine((val, ctx) => {
        if (val.length < min) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Login should contain at least ${min} characters`,
                fatal: true,
            });
            return z.NEVER;
        }

        if (val.length > max) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Login should contain at most ${max} characters`,
                fatal: true,
            });
            return z.NEVER;
        }

        if (val.includes('@')) {
            try {
                z.string().email().parse(val);
            } catch (err) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Login with '@' character should be valid email",
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
