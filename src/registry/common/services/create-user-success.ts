import type {AppContext} from '@gravity-ui/nodekit';

import type {BigIntId} from '../../../db/types/id';

export function createUserSuccess(_args: {ctx: AppContext; userId: BigIntId}) {
    return Promise.resolve();
}
