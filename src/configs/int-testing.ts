import type {AppConfig} from '@gravity-ui/nodekit';

import {features} from './common';
export default {
    features: {
        ...features,
    },
    swaggerEnabled: false,
} satisfies Partial<AppConfig>;
