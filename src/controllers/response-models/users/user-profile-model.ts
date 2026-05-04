import {z} from '../../../components/zod';

import {UserWithRolesFormatData, userWithRolesModel} from './user-with-roles-model';

const schema = z
    .object({
        profile: userWithRolesModel.schema,
    })
    .describe('User profile model');

export type UserProfileModel = z.infer<typeof schema>;

const format = (data: UserWithRolesFormatData): UserProfileModel => {
    return {
        profile: userWithRolesModel.format(data),
    };
};

export const userProfileModel = {
    schema,
    format,
};
