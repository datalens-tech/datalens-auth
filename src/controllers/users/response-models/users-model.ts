import {z} from '../../../components/zod';
import type {getUsersByIds} from '../../../services/users/get-users-by-Ids';
import {encodeId, macrotasksMap} from '../../../utils/ids';

const userSchema = z
    .strictObject({
        userId: z.string(),
        login: z.string().nullable(),
        email: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
    })
    .describe('User model');

const schema = z
    .strictObject({
        users: userSchema.array(),
    })
    .describe('Users by ids');

export type UsersByIdsResponseModel = z.infer<typeof schema>;

const format = async (
    data: Awaited<ReturnType<typeof getUsersByIds>>,
): Promise<z.infer<typeof schema>> => {
    return {
        users: await macrotasksMap(data.users, (user) => ({
            userId: encodeId(user.userId),
            login: user.login,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        })),
    };
};

export const usersByIdsModel = {
    schema,
    format,
};
