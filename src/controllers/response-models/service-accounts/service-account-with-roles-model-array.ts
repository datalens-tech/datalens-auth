import {z} from '../../../components/zod';
import {macrotasksMap} from '../../../utils/ids';

import {
    ServiceAccountWithRolesFormatData,
    serviceAccountWithRolesModel,
} from './service-account-with-roles-model';

const schema = serviceAccountWithRolesModel.schema
    .array()
    .describe('Service account with roles model array');

export type ServiceAccountWithRolesModelArray = z.infer<typeof schema>;

const format = (
    data: ServiceAccountWithRolesFormatData[],
): Promise<ServiceAccountWithRolesModelArray> => {
    return macrotasksMap(data, serviceAccountWithRolesModel.format);
};

export const serviceAccountWithRolesModelArray = {
    schema,
    format,
};
