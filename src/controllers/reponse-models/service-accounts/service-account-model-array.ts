import {z} from '../../../components/zod';
import {ServiceAccountModel} from '../../../db/models/service-account';
import {macrotasksMap} from '../../../utils/ids';

import {serviceAccountModel} from './service-account-model';

const schema = serviceAccountModel.schema.array().describe('Service account model array');

export type ServiceAccountModelArray = z.infer<typeof schema>;

const format = (data: ServiceAccountModel[]): Promise<z.infer<typeof schema>> => {
    return macrotasksMap(data, serviceAccountModel.format);
};

export const serviceAccountModelArray = {
    schema,
    format,
};
