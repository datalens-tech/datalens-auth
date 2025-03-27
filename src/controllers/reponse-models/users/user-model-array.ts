import {z} from '../../../components/zod';
import {macrotasksMap} from '../../../utils/ids';

import {UserFormatData, userModel} from './user-model';

const schema = userModel.schema.array().describe('User model array');

export type UserModelArray = z.infer<typeof schema>;

const format = (data: UserFormatData[]): Promise<UserModelArray> => {
    return macrotasksMap(data, userModel.format);
};

export const userModelArray = {
    schema,
    format,
};
