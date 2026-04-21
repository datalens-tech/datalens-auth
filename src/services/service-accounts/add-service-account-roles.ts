import {UserRole} from '../../constants/role';
import {
    ServiceAccountRoleModel,
    ServiceAccountRoleModelColumn,
} from '../../db/models/service-account-role';
import {BigIntId} from '../../db/types/id';
import {getPrimary} from '../../db/utils/db';
import {setCurrentTime} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';

export interface AddServiceAccountRolesArgs {
    deltas: {role: `${UserRole}`; subjectId: BigIntId}[];
}

export const addServiceAccountRoles = async (
    {ctx, trx}: ServiceArgs,
    args: AddServiceAccountRolesArgs,
): Promise<void> => {
    const {deltas} = args;

    ctx.log('ADD_SERVICE_ACCOUNT_ROLES');

    await ServiceAccountRoleModel.query(getPrimary(trx))
        .insert(
            deltas.map(({role, subjectId}) => ({
                [ServiceAccountRoleModelColumn.ServiceAccountId]: subjectId,
                [ServiceAccountRoleModelColumn.Role]: role,
                [ServiceAccountRoleModelColumn.UpdatedAt]: setCurrentTime(),
            })),
        )
        .onConflict([
            ServiceAccountRoleModelColumn.ServiceAccountId,
            ServiceAccountRoleModelColumn.Role,
        ])
        .merge()
        .timeout(ServiceAccountRoleModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('ADD_SERVICE_ACCOUNT_ROLES_SUCCESS');
};
