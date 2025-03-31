import type {AppContext} from '@gravity-ui/nodekit';

import type {BigIntId} from '../../../db/types/id';

export function getUsersListSuccess(_args: {ctx: AppContext; userIds: BigIntId[]}) {
    return Promise.resolve();
}
