import {z} from '../../../components/zod';
import {CreateServiceAccountKeyResult} from '../../../services/service-accounts/create-service-account-key';
import {encodeId} from '../../../utils/ids';

const schema = z
    .object({
        keyId: z.string(),
        privateKey: z.string(),
    })
    .describe('Created service account key');

export type CreateServiceAccountKeyModel = z.infer<typeof schema>;

const format = (data: CreateServiceAccountKeyResult): CreateServiceAccountKeyModel => {
    return {
        keyId: encodeId(data.keyId),
        privateKey: data.privateKey,
    };
};

export const createServiceAccountKeyModel = {
    schema,
    format,
};
