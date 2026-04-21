import {z} from '../../../components/zod';
import {ServiceAccountModelFields} from '../../../db/models/service-account';
import {encodeId} from '../../../utils/ids';

const schema = z
    .object({
        serviceAccountId: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .describe('Service account model');

export type ServiceAccountFormatData = ServiceAccountModelFields;

const format = (data: ServiceAccountFormatData): z.infer<typeof schema> => {
    return {
        serviceAccountId: encodeId(data.serviceAccountId),
        name: data.name,
        description: data.description,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
};

export const serviceAccountModel = {
    schema,
    format,
};
