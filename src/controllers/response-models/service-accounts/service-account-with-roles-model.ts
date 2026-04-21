import {z} from '../../../components/zod';
import {UserRole} from '../../../constants/role';

import {ServiceAccountFormatData, serviceAccountModel} from './service-account-model';

const schema = serviceAccountModel.schema
    .extend({
        roles: z.enum(UserRole).array(),
    })
    .describe('Service account with roles model');

export type ServiceAccountWithRolesModel = z.infer<typeof schema>;

export type ServiceAccountWithRolesFormatData = ServiceAccountFormatData & {
    roles: `${UserRole}`[];
};

const format = (data: ServiceAccountWithRolesFormatData): ServiceAccountWithRolesModel => {
    return {
        ...serviceAccountModel.format(data),
        roles: data.roles as UserRole[],
    };
};

export const serviceAccountWithRolesModel = {
    schema,
    format,
};
