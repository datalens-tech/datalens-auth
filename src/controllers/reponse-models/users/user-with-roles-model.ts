import {z} from '../../../components/zod';
import {UserRole} from '../../../constants/role';

import {UserFormatData, userModel} from './user-model';

const schema = userModel.schema
    .merge(
        z.object({
            roles: z.nativeEnum(UserRole).array(),
        }),
    )
    .describe('User with roles model');

export type UserWithRolesModel = z.infer<typeof schema>;

export type UserWithRolesFormatData = UserFormatData & {
    roles: `${UserRole}`[];
};

const format = (data: UserWithRolesFormatData): UserWithRolesModel => {
    return {
        ...userModel.format(data),
        roles: data.roles as UserRole[],
    };
};

export const userWithRolesModel = {
    schema,
    format,
};
