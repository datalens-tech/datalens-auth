import {makeFunctionTemplate} from '../utils/make-function-template';

import type {example} from './example';

export const commonFunctionsMap = {
    example: makeFunctionTemplate<typeof example>(),
} as const;
