import {z} from 'zod';

import {PASSWORD_REGEX, PASSWORD_REGEX_ERROR_MESSAGE} from '../../validation/regexp';

export const password = () =>
    z.string().min(8).regex(new RegExp(PASSWORD_REGEX), PASSWORD_REGEX_ERROR_MESSAGE);
