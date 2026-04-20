import {z} from '../../../components/zod';
import {ServiceAccountKey} from '../../../services/service-accounts/list-service-account-keys';
import {macrotasksMap} from '../../../utils/ids';

import {serviceAccountKeyModel} from './service-account-key-model';

const schema = serviceAccountKeyModel.schema.array().describe('Service account key model array');

export type ServiceAccountKeyModelArray = z.infer<typeof schema>;

const format = (data: ServiceAccountKey[]): Promise<ServiceAccountKeyModelArray> => {
    return macrotasksMap(data, serviceAccountKeyModel.format);
};

export const serviceAccountKeyModelArray = {
    schema,
    format,
};
