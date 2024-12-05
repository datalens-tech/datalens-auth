import {makeClassTemplate} from '../utils/make-class-template';

import type {ExampleContructor} from './example';

export const commonClassesMap = {
    Example: makeClassTemplate<ExampleContructor>(),
} as const;
