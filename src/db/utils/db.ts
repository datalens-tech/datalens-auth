import {TransactionOrKnex} from 'objection';

import {Model} from '..';

export const getPrimary = (trx?: TransactionOrKnex) => {
    return trx ?? Model.primary;
};

export const getReplica = (trx?: TransactionOrKnex) => {
    return trx ?? Model.replica;
};
