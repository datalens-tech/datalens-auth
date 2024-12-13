import type {AppContext} from '@gravity-ui/nodekit';
import type {TransactionOrKnex} from 'objection';

export interface ServiceArgs {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    skipValidation?: boolean;
}
