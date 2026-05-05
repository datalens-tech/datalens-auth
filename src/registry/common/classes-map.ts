import {makeClassTemplate} from '../utils/make-class-template';

import type {ExampleConstructor} from './example';

export const commonClassesMap = {
    Example: makeClassTemplate<ExampleConstructor>(),
} as const;
