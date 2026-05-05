import {z} from '../../../components/zod';
import {ServiceAccountKey} from '../../../services/service-accounts/list-service-account-keys';
import {encodeId} from '../../../utils/ids';

const schema = z
    .object({
        keyId: z.string(),
        createdAt: z.string(),
        serviceAccountId: z.string(),
    })
    .describe('Service account key model');

export type ServiceAccountKeyModel = z.infer<typeof schema>;

const format = (data: ServiceAccountKey): ServiceAccountKeyModel => {
    return {
        keyId: encodeId(data.keyId),
        createdAt: data.createdAt,
        serviceAccountId: encodeId(data.serviceAccountId),
    };
};

export const serviceAccountKeyModel = {
    schema,
    format,
};
