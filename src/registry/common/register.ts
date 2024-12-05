import {registry} from '../index';

import {Example, example} from './example';

export const registerCommonPlugins = () => {
    registry.common.classes.register({
        Example,
    });

    registry.common.functions.register({
        example,
    });
};
