import {z} from '../../../components/zod';
import {UserRole} from '../../../constants/role';
import type {ResultUser} from '../../../services/users/get-users-list';
import {encodeId} from '../../../utils/ids';

const schema = z
    .strictObject({
        userId: z.string(),
        login: z.string().nullable(),
        email: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        idpType: z.string().nullable(),
        idpSlug: z.string().nullable(),
        roles: z.nativeEnum(UserRole).array(),
    })
    .describe('User with roles model');

export type UserWithRoleResponseModel = z.infer<typeof schema>;

const format = (data: ResultUser): z.infer<typeof schema> => {
    return {
        userId: encodeId(data.userId),
        login: data.login,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        idpType: data.idpType,
        idpSlug: data.idpSlug,
        roles: data.roles as UserRole[],
    };
};

export const userWithRoleModel = {
    schema,
    format,
};
