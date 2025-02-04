import {UserRole} from '../../constants/role';
import {RoleModel, RoleModelColumn} from '../../db/models/role';
import {BigIntId} from '../../db/types/id';
import {getPrimary} from '../../db/utils/db';
import {setCurrentTime} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';

export interface AddUsersRolesArgs {
    deltas: {role: `${UserRole}`; subjectId: BigIntId}[];
}

export const addUsersRoles = async ({ctx, trx}: ServiceArgs, args: AddUsersRolesArgs) => {
    const {deltas} = args;

    ctx.log('ADD_USERS_ROLES');

    await RoleModel.query(getPrimary(trx))
        .insert(
            deltas.map(({role, subjectId}) => ({
                [RoleModelColumn.UserId]: subjectId,
                [RoleModelColumn.Role]: role,
                [RoleModelColumn.UpdatedAt]: setCurrentTime(),
            })),
        )
        .onConflict([RoleModelColumn.UserId, RoleModelColumn.Role])
        .merge()
        .timeout(RoleModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('ADD_USERS_ROLES_SUCCESS');
};
