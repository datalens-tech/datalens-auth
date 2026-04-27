import {TransactionOrKnex} from 'objection';

import {UserRole} from '../../constants/role';
import {Optional} from '../../utils/utility-types';
import {RoleModel, RoleModelColumn} from '../models/role';
import type {BigIntId} from '../types/id';

export const insertRoles = async (
    trx: TransactionOrKnex,
    userId: BigIntId,
    roles: Optional<UserRole[]> | undefined,
    defaultRole: UserRole,
) => {
    const resultRoles = (Array.isArray(roles) ? roles : [defaultRole]).filter(Boolean);

    if (resultRoles.length) {
        const normalizedRoles = Array.from(new Set(resultRoles));
        await RoleModel.query(trx)
            .insert(
                normalizedRoles.map((role) => ({
                    [RoleModelColumn.UserId]: userId,
                    [RoleModelColumn.Role]: role,
                })),
            )
            .timeout(RoleModel.DEFAULT_QUERY_TIMEOUT);
    }
};
