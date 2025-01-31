import {z} from '../../../components/zod';
import {UserRole} from '../../../constants/role';
import type {UserProfile} from '../../../services/users/get-user-profile';
import {encodeId} from '../../../utils/ids';

const schema = z
    .strictObject({
        profile: z.strictObject({
            userId: z.string(),
            login: z.string().nullable(),
            email: z.string().nullable(),
            firstName: z.string().nullable(),
            lastName: z.string().nullable(),
            roles: z.nativeEnum(UserRole).array(),
        }),
    })
    .describe('User profile model');

export type UserProfileResponseModel = z.infer<typeof schema>;

const format = (data: UserProfile): z.infer<typeof schema> => {
    return {
        profile: {
            userId: encodeId(data.userId),
            login: data.login,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            roles: data.roles as UserRole[],
        },
    };
};

export const userProfileModel = {
    schema,
    format,
};
