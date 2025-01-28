import {z} from '../../../components/zod';
import {UserModel} from '../../../db/models/user';
import {encodeId} from '../../../utils/ids';

const schema = z
    .strictObject({
        userId: z.string(),
    })
    .describe('Created user model');

export type CreateUserResponseModel = z.infer<typeof schema>;

const format = (data: UserModel): CreateUserResponseModel => {
    return {
        userId: encodeId(data.userId),
    };
};

export const createUserModel = {
    schema,
    format,
};
