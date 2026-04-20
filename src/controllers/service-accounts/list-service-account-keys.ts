import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../constants/content-type';
import {listServiceAccountKeys} from '../../services/service-accounts/list-service-account-keys';
import {serviceAccountKeyModelArray} from '../reponse-models/service-accounts/service-account-key-model-array';

const requestSchema = {
    params: z.object({
        serviceAccountId: zc.decodeId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const responseSchema = z
    .object({
        keys: serviceAccountKeyModelArray.schema,
    })
    .describe('Service account keys list');

type ResponseBody = z.infer<typeof responseSchema>;

export const listServiceAccountKeysController: AppRouteHandler = async (
    req,
    res: Response<ResponseBody>,
) => {
    const {params} = await parseReq(req);

    const keys = await listServiceAccountKeys(
        {ctx: req.ctx},
        {serviceAccountId: params.serviceAccountId},
    );

    res.status(200).send({
        keys: await serviceAccountKeyModelArray.format(keys),
    });
};

listServiceAccountKeysController.api = {
    summary: 'List service account keys',
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
