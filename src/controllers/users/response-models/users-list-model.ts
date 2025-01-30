import {z} from '../../../components/zod';
import type {getUsersList} from '../../../services/users/get-users-list';
import {macrotasksMap} from '../../../utils/ids';

import {userWithRoleModel} from './user-with-role-model';

const schema = z
    .strictObject({
        nextPageToken: z.string().optional(),
        users: userWithRoleModel.schema.array(),
    })
    .describe('Users list');

export type UserListResponseModel = z.infer<typeof schema>;

const format = async (
    data: Awaited<ReturnType<typeof getUsersList>>,
): Promise<z.infer<typeof schema>> => {
    return {
        nextPageToken: data.nextPageToken,
        users: await macrotasksMap(data.users, userWithRoleModel.format),
    };
};

export const usersListModel = {
    schema,
    format,
};
