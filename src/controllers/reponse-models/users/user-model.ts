import {z} from '../../../components/zod';
import {BigIntId} from '../../../db/types/id';
import {encodeId} from '../../../utils/ids';

const schema = z
    .object({
        userId: z.string(),
        login: z.string().nullable(),
        email: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        idpType: z.string().nullable(),
        idpSlug: z.string().nullable(),
    })
    .describe('User model');

export type UserModel = z.infer<typeof schema>;

export type UserFormatData = Omit<UserModel, 'userId'> & {userId: BigIntId};

const format = (data: UserFormatData): UserModel => {
    return {
        userId: encodeId(data.userId),
        login: data.login,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        idpType: data.idpType,
        idpSlug: data.idpSlug,
    };
};

export const userModel = {
    schema,
    format,
};
