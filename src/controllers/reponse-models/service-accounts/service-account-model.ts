import {z} from '../../../components/zod';
import {UserRole} from '../../../constants/role';
import {ServiceAccountModel} from '../../../db/models/service-account';
import {encodeId} from '../../../utils/ids';

const schema = z
    .object({
        serviceAccountId: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        roles: z.enum(UserRole).array(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .describe('Service account model');

const format = (data: ServiceAccountModel): z.infer<typeof schema> => {
    return {
        serviceAccountId: encodeId(data.serviceAccountId),
        name: data.name,
        description: data.description,
        roles: data.roles as UserRole[],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
};

export const serviceAccountModel = {
    schema,
    format,
};
