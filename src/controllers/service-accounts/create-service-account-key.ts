import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {createServiceAccountKey} from '../../services/service-accounts/create-service-account-key';
import {
    CreateServiceAccountKeyModel,
    createServiceAccountKeyModel,
} from '../reponse-models/service-accounts/create-service-account-key-model';

const requestSchema = {
    params: z.object({
        serviceAccountId: zc.decodeId(),
    }),
};

const responseSchema = createServiceAccountKeyModel.schema;

const parseReq = makeReqParser(requestSchema);

export const createServiceAccountKeyController: AppRouteHandler = async (
    req,
    res: Response<CreateServiceAccountKeyModel>,
) => {
    const {params} = await parseReq(req);

    const result = await createServiceAccountKey(
        {ctx: req.ctx},
        {serviceAccountId: params.serviceAccountId},
    );

    res.status(200).send(createServiceAccountKeyModel.format(result));
};

createServiceAccountKeyController.api = {
    summary: 'Create a service account key',
    tags: [ApiTag.Management],
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: responseSchema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: responseSchema,
                },
            },
        },
    },
};
