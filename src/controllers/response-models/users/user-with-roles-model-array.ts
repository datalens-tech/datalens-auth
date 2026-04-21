import {z} from '../../../components/zod';
import {macrotasksMap} from '../../../utils/ids';

import {UserWithRolesFormatData, userWithRolesModel} from './user-with-roles-model';

const schema = userWithRolesModel.schema.array().describe('User with roles model array');

export type UserWithRolesModelArray = z.infer<typeof schema>;

const format = (data: UserWithRolesFormatData[]): Promise<UserWithRolesModelArray> => {
    return macrotasksMap(data, userWithRolesModel.format);
};

export const userWithRolesModelArray = {
    schema,
    format,
};
