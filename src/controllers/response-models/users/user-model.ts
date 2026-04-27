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
        name: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        type: z.string().optional(),
    })
    .describe('User model');

export type UserModel = z.infer<typeof schema>;

export type UserFormatData = {
    userId: BigIntId;
    login: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    idpType: string | null;
    idpSlug: string | null;
    name?: string | null;
    description?: string | null;
    type?: string;
};

const format = (data: UserFormatData): UserModel => {
    return {
        userId: encodeId(data.userId),
        login: data.login,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        idpType: data.idpType,
        idpSlug: data.idpSlug,
        name: data.name,
        description: data.description,
        type: data.type,
    };
};

export const userModel = {
    schema,
    format,
};
